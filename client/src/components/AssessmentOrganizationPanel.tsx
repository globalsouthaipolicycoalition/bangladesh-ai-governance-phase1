import { useState } from "react";
import { Building2, Link2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Props = {
  assessmentId: number;
  organizationId: number | null;
  sector: string | null;
  jurisdiction: string | null;
  isAssessmentOwner: boolean;
};

export default function AssessmentOrganizationPanel({ assessmentId, organizationId, sector, jurisdiction, isAssessmentOwner }: Props) {
  const [name, setName] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const organizations = trpc.agaras.managedOrganizations.useQuery(undefined, { enabled: isAssessmentOwner && !organizationId });
  const utils = trpc.useUtils();
  const refresh = async () => {
    await Promise.all([
      utils.agaras.dashboard.invalidate({ assessmentId }),
      utils.agaras.myAssessments.invalidate(),
      utils.agaras.managedOrganizations.invalidate(),
    ]);
  };
  const createAndLink = trpc.agaras.createOrganizationForAssessment.useMutation({ onSuccess: refresh });
  const linkExisting = trpc.agaras.linkAssessmentOrganization.useMutation({ onSuccess: refresh });
  if (!isAssessmentOwner) return null;

  return (
    <section className="workspace-panel" aria-labelledby="organization-context-title">
      <div className="panel-header"><div><span className="card-kicker">ORGANIZATION WORKSPACE</span><h2 id="organization-context-title">Assessment access</h2></div><Building2 size={18} /></div>
      {organizationId ? (
        <div className="workspace-organization-state">
          <p>This assessment is linked to organization <strong>#{organizationId}</strong>. Active authorized organization members can access it according to their role.</p>
          <a className="panel-link" href={`/observatory/systems?organizationId=${organizationId}`}>Open the organization AI-system register <Link2 size={15} /></a>
        </div>
      ) : (
        <>
          <p>Linking an organization grants active authorized members access according to their role. This association can only be set before the assessment is submitted.</p>
          {organizations.isLoading && <p role="status">Loading organizations you can manage…</p>}
          {organizations.isError && <p role="alert">Could not load managed organizations: {organizations.error.message}</p>}
          {organizations.isSuccess && organizations.data.length > 0 && (
            <div className="workspace-org-link-row">
              <label>Link an existing organization
                <select value={selectedOrganizationId} onChange={event => setSelectedOrganizationId(event.target.value)}>
                  <option value="">Choose an organization</option>
                  {organizations.data.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                </select>
              </label>
              <button type="button" className="outline-button" disabled={!selectedOrganizationId || linkExisting.isPending} onClick={() => {
                const organization = organizations.data.find(item => String(item.id) === selectedOrganizationId);
                if (organization && window.confirm(`Link “${organization.name}” to this assessment? Its active authorized members will gain access.`)) linkExisting.mutate({ assessmentId, organizationId: organization.id });
              }}>{linkExisting.isPending ? "Linking…" : "Link organization"}</button>
            </div>
          )}
          <form className="workspace-org-create" onSubmit={event => {
            event.preventDefault();
            if (name.trim().length < 2) return;
            createAndLink.mutate({ assessmentId, name: name.trim(), sector: sector ?? undefined, jurisdiction: jurisdiction ?? undefined });
          }}>
            <label>Create a new organization and link it
              <input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={255} required placeholder="Organization name" />
            </label>
            <button type="submit" className="button button-dark" disabled={createAndLink.isPending || name.trim().length < 2}>{createAndLink.isPending ? "Creating…" : "Create and link"}</button>
          </form>
          {organizations.isSuccess && organizations.data.length === 0 && <p className="muted-copy">No organizations are available to link yet. Create one above.</p>}
          {createAndLink.isError && <p role="alert">Could not create and link organization: {createAndLink.error.message}</p>}
          {linkExisting.isError && <p role="alert">Could not link organization: {linkExisting.error.message}</p>}
        </>
      )}
    </section>
  );
}
