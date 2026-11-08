
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const controlCategories = [
  'Organizativo',
  'Personas',
  'Físico',
  'Tecnológico',
] as const

type ControlCategory = typeof controlCategories[number]
type Applicability = 'Aplicable' | 'No aplicable'

type ImplementationStatus =
  | 'No iniciado'
  | 'En curso'
  | 'Implantado'
  | 'No aplica'

interface Control {
  id: string
  code: string
  name: string
  description: string
  category: ControlCategory
  sort_order: number
}

interface OrganizationControl {
  id: string
  organization_id: string
  control_id: string
  applicability: Applicability
  justification: string | null
  implementation_status: ImplementationStatus
  responsible_user_id: string | null
  review_date: string | null
}

interface OrganizationMember {
  user_id: string
  display_name: string
  organization_role: string
}

interface SoaControl extends Control {
  evaluation: OrganizationControl | null
}

interface SoaPageProps {
  organizationId: string | null
  userId: string
  canManageOrganization: boolean
}

interface EvaluationForm {
  applicability: Applicability
  implementation_status: ImplementationStatus
  justification: string
  review_date: string
  responsible_user_id: string | null
}

const emptyForm: EvaluationForm = {
  applicability: 'Aplicable',
  implementation_status: 'No iniciado',
  justification: '',
  review_date: '',
  responsible_user_id: null,
}

export default function SoaPage({
  organizationId,
  userId,
  canManageOrganization,
}: SoaPageProps) {
  const [controls, setControls] = useState<Control[]>([])
  const [evaluations, setEvaluations] = useState<OrganizationControl[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingControlId, setEditingControlId] = useState<string | null>(null)
  const [form, setForm] = useState<EvaluationForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [savingError, setSavingError] = useState<string | null>(null)

  const [resettingControlId, setResettingControlId] = useState<string | null>(null)
  const [resetError, setResetError] = useState<{
    controlId: string
    message: string
  } | null>(null)

  // Cargar controles y evaluaciones de la organización.
  useEffect(() => {
    let isMounted = true

    async function loadSoaData() {
      if (!organizationId) {
        setControls([])
        setEvaluations([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const [controlsResult, evaluationsResult] = await Promise.all([
        supabase
          .from('controls')
          .select('id, code, name, description, category, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        supabase
          .from('organization_controls')
          .select(
            'id, organization_id, control_id, applicability, justification, implementation_status, responsible_user_id, review_date',
          )
          .eq('organization_id', organizationId),
      ])

      if (!isMounted) return

      if (controlsResult.error || evaluationsResult.error) {
        console.error(
          'Error al cargar la declaración de aplicabilidad:',
          controlsResult.error?.message,
          evaluationsResult.error?.message,
        )

        setError(
          'No se ha podido cargar la declaración de aplicabilidad. Comprueba tu conexión e inténtalo de nuevo.',
        )

        setControls([])
        setEvaluations([])
      } else {
        setControls((controlsResult.data ?? []) as Control[])
        setEvaluations(
          (evaluationsResult.data ?? []) as OrganizationControl[],
        )
      }

      setLoading(false)
    }

    void loadSoaData()

    return () => {
      isMounted = false
    }
  }, [organizationId])

  // Cargar los miembros activos para todos los usuarios de la organización.
  useEffect(() => {
    let isMounted = true

    async function loadMembers() {
      setMembers([])
      setMembersError(null)

      if (!organizationId) return

      const { data, error: membersQueryError } = await supabase.rpc(
        'get_active_organization_members',
        {
          p_organization_id: organizationId,
        },
      )

      if (!isMounted) return

      if (membersQueryError) {
        console.error(
          'Error al cargar los miembros de la organización:',
          membersQueryError.message,
        )

        setMembersError(
          'No se ha podido cargar la lista de responsables.',
        )
        return
      }

      setMembers((data ?? []) as OrganizationMember[])
    }

    void loadMembers()

    return () => {
      isMounted = false
    }
  }, [organizationId])

  const membersById = useMemo(
    () => new Map(
      members.map((member) => [
        member.user_id,
        member.display_name,
      ]),
    ),
    [members],
  )

  const soaControls = useMemo<SoaControl[]>(() => {
    const evaluationsByControl = new Map(
      evaluations.map((evaluation) => [
        evaluation.control_id,
        evaluation,
      ]),
    )

    return controls.map((control) => ({
      ...control,
      evaluation: evaluationsByControl.get(control.id) ?? null,
    }))
  }, [controls, evaluations])

  const filteredControls = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return soaControls

    return soaControls.filter((control) =>
      [
        control.code,
        control.name,
        control.description,
        control.category,
        control.evaluation?.applicability ?? '',
        control.evaluation?.implementation_status ?? '',
        control.evaluation?.responsible_user_id
          ? membersById.get(control.evaluation.responsible_user_id) ?? ''
          : '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    )
  }, [searchTerm, soaControls, membersById])

  const evaluatedCount = evaluations.length

  function canEditControl(control: SoaControl) {
    return (
      canManageOrganization ||
      (
        control.evaluation !== null &&
        control.evaluation.responsible_user_id === userId
      )
    )
  }

  function startEditing(control: SoaControl) {
    if (!canEditControl(control)) return

    const evaluation = control.evaluation

    setForm({
      applicability: evaluation?.applicability ?? 'Aplicable',
      implementation_status:
        evaluation?.implementation_status ?? 'No iniciado',
      justification: evaluation?.justification ?? '',
      review_date: evaluation?.review_date ?? '',
      responsible_user_id: evaluation?.responsible_user_id ?? null,
    })

    setEditingControlId(control.id)
    setSavingError(null)
    setResetError(null)
  }

  function cancelEditing() {
    setEditingControlId(null)
    setForm(emptyForm)
    setSavingError(null)
  }

  function updateApplicability(value: Applicability) {
    setForm((current) => ({
      ...current,
      applicability: value,
      implementation_status:
        value === 'No aplicable'
          ? 'No aplica'
          : current.implementation_status === 'No aplica'
            ? 'No iniciado'
            : current.implementation_status,
      justification:
        value === 'Aplicable' ? '' : current.justification,
    }))
  }

  async function saveEvaluation(control: SoaControl) {
    if (!organizationId || !canEditControl(control) || saving) return

    if (!control.evaluation && !canManageOrganization) return

    if (
      form.applicability === 'No aplicable' &&
      !form.justification.trim()
    ) {
      setSavingError(
        'Debes indicar una justificación para los controles no aplicables.',
      )
      return
    }

    if (
      form.applicability === 'Aplicable' &&
      form.implementation_status === 'No aplica'
    ) {
      setSavingError(
        'Un control aplicable debe tener un estado de implantación válido.',
      )
      return
    }

    // Si se asigna un responsable, debe estar en la lista de miembros activos.
    if (
      canManageOrganization &&
      form.responsible_user_id !== null &&
      !members.some(
        (member) => member.user_id === form.responsible_user_id,
      )
    ) {
      setSavingError(
        'El responsable seleccionado no pertenece a la organización o no está activo.',
      )
      return
    }

    setSaving(true)
    setSavingError(null)

    const evaluationPayload = {
      applicability: form.applicability,
      implementation_status: form.implementation_status,
      justification:
        form.applicability === 'No aplicable'
          ? form.justification.trim()
          : null,
      review_date: form.review_date || null,
    }

    // El responsable solo se incluye cuando quien guarda es administrador.
    // Los usuarios estándar no pueden modificar este campo.
    const adminPayload = canManageOrganization
      ? {
          ...evaluationPayload,
          responsible_user_id: form.responsible_user_id,
        }
      : evaluationPayload

    const query = control.evaluation
      ? supabase
          .from('organization_controls')
          .update(adminPayload)
          .eq('organization_id', organizationId)
          .eq('control_id', control.id)
      : supabase
          .from('organization_controls')
          .insert({
            organization_id: organizationId,
            control_id: control.id,
            ...evaluationPayload,
            responsible_user_id: form.responsible_user_id,
          })

    const { data, error: saveError } = await query
      .select(
        'id, organization_id, control_id, applicability, justification, implementation_status, responsible_user_id, review_date',
      )
      .single()

    setSaving(false)

    if (saveError || !data) {
      console.error(
        'Error al guardar la evaluación:',
        saveError?.message,
      )

      setSavingError(
        'No se ha podido guardar la evaluación. Comprueba tus permisos e inténtalo de nuevo.',
      )
      return
    }

    setEvaluations((current) => {
      const withoutCurrent = current.filter(
        (item) => item.control_id !== control.id,
      )

      return [...withoutCurrent, data as OrganizationControl]
    })

    cancelEditing()
  }

  async function resetEvaluation(control: SoaControl) {
    if (
      !organizationId ||
      !canManageOrganization ||
      !control.evaluation ||
      resettingControlId !== null
    ) {
      return
    }

    const confirmed = window.confirm(
      `¿Deseas restablecer la evaluación del control ${control.code}?\n\n` +
      'Se eliminarán su aplicabilidad, estado, justificación, responsable y fecha de revisión.\n\n' +
      'El control seguirá existiendo en el catálogo y volverá a aparecer como «Sin evaluar».',
    )

    if (!confirmed) return

    setResettingControlId(control.id)
    setResetError(null)
    setSavingError(null)

    const { data, error: deleteError } = await supabase
      .from('organization_controls')
      .delete()
      .eq('organization_id', organizationId)
      .eq('control_id', control.id)
      .select('id')

    setResettingControlId(null)

    if (deleteError || !data || data.length === 0) {
      console.error(
        'Error al restablecer la evaluación:',
        deleteError?.message ?? 'No se ha eliminado ninguna fila.',
      )

      setResetError({
        controlId: control.id,
        message: `No se ha podido restablecer el control ${control.code}. Comprueba tus permisos e inténtalo de nuevo.`,
      })
      return
    }

    setEvaluations((current) =>
      current.filter((item) => item.control_id !== control.id),
    )

    if (editingControlId === control.id) {
      cancelEditing()
    }
  }

  if (!organizationId) {
    return (
      <section className="panel controls-message">
        <h3>Selecciona una organización</h3>
        <p>
          Para consultar su declaración de aplicabilidad, primero debes
          seleccionar una organización activa.
        </p>
      </section>
    )
  }

  return (
    <div className="soa-page">
      <section className="controls-information">
        <div className="controls-information-icon" aria-hidden="true">
          i
        </div>

        <div>
          <strong>Declaración de aplicabilidad (SOA)</strong>
          <p>
            Esta sección permite consultar la evaluación de los controles
            del Anexo A para la organización seleccionada. Un control sin
            evaluación registrada aparece como «Sin evaluar».
          </p>
        </div>
      </section>

      <section className="controls-toolbar">
        <div>
          <h3>Evaluación de controles</h3>
          <p>
            {loading
              ? 'Cargando evaluaciones...'
              : `${evaluatedCount} de ${controls.length} controles con evaluación registrada`}
          </p>
        </div>

        <div className="controls-count">
          {loading ? '--' : `${controls.length} controles`}
        </div>
      </section>

      <div className="controls-search">
        <span aria-hidden="true">⌕</span>

        <input
          type="search"
          placeholder="Buscar por código, nombre, descripción o estado..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Buscar controles de la declaración de aplicabilidad"
        />
      </div>

      {loading ? (
        <section className="panel controls-message">
          <div className="loading-spinner" />
          <p>Cargando declaración de aplicabilidad...</p>
        </section>
      ) : error ? (
        <section className="panel controls-message">
          <div className="empty-icon" aria-hidden="true">!</div>
          <h3>No se ha podido cargar la SOA</h3>
          <p>{error}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </section>
      ) : controls.length === 0 ? (
        <section className="panel controls-message">
          <h3>No hay controles disponibles</h3>
          <p>No se han encontrado controles activos en el catálogo.</p>
        </section>
      ) : filteredControls.length === 0 ? (
        <section className="panel controls-message">
          <h3>No se han encontrado resultados</h3>
          <p>Prueba con otro código, nombre o término de búsqueda.</p>
        </section>
      ) : (
        <div className="controls-categories">
          {controlCategories.map((category) => {
            const categoryControls = filteredControls.filter(
              (control) => control.category === category,
            )

            if (categoryControls.length === 0) return null

            return (
              <section
                className="panel controls-category"
                key={category}
              >
                <div className="controls-category-heading">
                  <div>
                    <h3>{category}</h3>
                    <p>{categoryControls.length} controles</p>
                  </div>
                </div>

                <div className="controls-list">
                  {categoryControls.map((control) => {
                    const evaluation = control.evaluation
                    const isEditing = editingControlId === control.id
                    const canEditThisControl = canEditControl(control)

                    const responsibleName = evaluation?.responsible_user_id
                      ? `${
                          membersById.get(evaluation.responsible_user_id) ??
                          'Miembro asignado'
                        }${
                          evaluation.responsible_user_id === userId
                            ? ' (Tú)'
                            : ''
                        }`
                      : 'Sin asignar'

                    return (
                      <article
                        className="control-item soa-control-item"
                        key={control.id}
                      >
                        <div className="control-code">
                          {control.code}
                        </div>

                        <div className="control-details">
                          <div className="soa-control-heading">
                            <div>
                              <h4>{control.name}</h4>
                              <p>{control.description}</p>
                            </div>

                            {canEditThisControl && (
                              <div className="soa-control-actions">
                                <button
                                  className="soa-edit-button"
                                  type="button"
                                  onClick={() =>
                                    isEditing
                                      ? cancelEditing()
                                      : startEditing(control)
                                  }
                                  disabled={saving}
                                >
                                  {isEditing ? 'Cancelar' : 'Editar'}
                                </button>
                              </div>
                            )}
                          </div>

                          {resetError?.controlId === control.id && (
                            <p className="soa-save-error" role="alert">
                              {resetError.message}
                            </p>
                          )}

                          {isEditing ? (
                            <div className="soa-edit-form">
                              <div className="soa-form-grid">
                                <label>
                                  Aplicabilidad
                                  <select
                                    value={form.applicability}
                                    onChange={(event) =>
                                      updateApplicability(
                                        event.target.value as Applicability,
                                      )
                                    }
                                  >
                                    <option value="Aplicable">Aplicable</option>
                                    <option value="No aplicable">No aplicable</option>
                                  </select>
                                </label>

                                <label>
                                  Estado de implantación
                                  <select
                                    value={form.implementation_status}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        implementation_status:
                                          event.target.value as ImplementationStatus,
                                      }))
                                    }
                                    disabled={
                                      form.applicability === 'No aplicable'
                                    }
                                  >
                                    <option value="No iniciado">No iniciado</option>
                                    <option value="En curso">En curso</option>
                                    <option value="Implantado">Implantado</option>
                                    {form.applicability === 'No aplicable' && (
                                      <option value="No aplica">No aplica</option>
                                    )}
                                  </select>
                                </label>

                                <label>
                                  Fecha de revisión
                                  <input
                                    type="date"
                                    value={form.review_date}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        review_date: event.target.value,
                                      }))
                                    }
                                  />
                                </label>

                                {canManageOrganization && (
                                  <label>
                                    Responsable del control
                                    <select
                                      value={form.responsible_user_id ?? ''}
                                      onChange={(event) =>
                                        setForm((current) => ({
                                          ...current,
                                          responsible_user_id:
                                            event.target.value || null,
                                        }))
                                      }
                                      disabled={membersError !== null}
                                    >
                                      <option value="">Sin asignar</option>
                                      {members.map((member) => (
                                        <option
                                          key={member.user_id}
                                          value={member.user_id}
                                        >
                                          {member.display_name} — {member.organization_role === 'admin'
                                            ? 'Administrador'
                                            : 'Usuario estándar'}
                                        </option>
                                      ))}
                                    </select>
                                    {membersError && (
                                      <small role="alert">
                                        {membersError}
                                      </small>
                                    )}
                                  </label>
                                )}
                              </div>

                              {form.applicability === 'No aplicable' && (
                                <label className="soa-justification-field">
                                  Justificación de la no aplicabilidad
                                  <textarea
                                    value={form.justification}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        justification: event.target.value,
                                      }))
                                    }
                                    rows={3}
                                    placeholder="Explica por qué este control no resulta aplicable a la organización..."
                                  />
                                </label>
                              )}

                              {savingError && (
                                <p className="soa-save-error" role="alert">
                                  {savingError}
                                </p>
                              )}

                              <div className="soa-form-actions">
                                <button
                                  className="primary-button"
                                  type="button"
                                  disabled={
                                    saving ||
                                    (
                                      canManageOrganization &&
                                      membersError !== null
                                    )
                                  }
                                  onClick={() => void saveEvaluation(control)}
                                >
                                  {saving ? 'Guardando...' : 'Guardar evaluación'}
                                </button>

                                <button
                                  className="soa-cancel-button"
                                  type="button"
                                  disabled={saving}
                                  onClick={cancelEditing}
                                >
                                  Cancelar
                                </button>

                                {canManageOrganization && evaluation && (
                                  <button
                                    className="soa-reset-button"
                                    type="button"
                                    disabled={
                                      saving || resettingControlId !== null
                                    }
                                    onClick={() =>
                                      void resetEvaluation(control)
                                    }
                                  >
                                    {resettingControlId === control.id
                                      ? 'Restableciendo...'
                                      : 'Restablecer evaluación'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <dl className="soa-control-metadata">
                                <div>
                                  <dt>Aplicabilidad</dt>
                                  <dd>
                                    {evaluation?.applicability ?? 'Sin evaluar'}
                                  </dd>
                                </div>

                                <div>
                                  <dt>Estado</dt>
                                  <dd>
                                    {evaluation?.implementation_status ?? 'Sin evaluar'}
                                  </dd>
                                </div>

                                <div>
                                  <dt>Responsable</dt>
                                  <dd>{responsibleName}</dd>
                                </div>

                                <div>
                                  <dt>Revisión</dt>
                                  <dd>
                                    {evaluation?.review_date
                                      ? new Date(
                                          `${evaluation.review_date}T00:00:00`,
                                        ).toLocaleDateString('es-ES')
                                      : 'Sin fecha'}
                                  </dd>
                                </div>
                              </dl>

                              {evaluation?.applicability === 'No aplicable' && (
                                <p className="soa-justification">
                                  <strong>Justificación:</strong>{' '}
                                  {evaluation.justification}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
