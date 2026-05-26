export function CiLegend() {
  return (
    <div className="legend">
      <span data-ci="success">success</span>
      <span data-ci="failure">failure</span>
      <span data-ci="running">running</span>
      <span data-ci="none">none</span>
    </div>
  );
}

export function WorkflowRunLegend() {
  return (
    <div className="legend">
      <span data-ci="success">success</span>
      <span data-ci="failure">failure</span>
      <span data-ci="running">running</span>
      <span data-ci="neutral">neutral</span>
    </div>
  );
}

export function TeamLegend() {
  return (
    <div className="legend">
      <span data-ci="team admin">admin</span>
      <span data-ci="team maintain">maintain</span>
      <span data-ci="team push">push</span>
      <span data-ci="team triage">triage</span>
      <span data-ci="team pull">pull</span>
      <span data-ci="team secret">secret</span>
      <span data-ci="team child">nested</span>
      <span data-ci="team large">large</span>
      <span data-ci="team empty">empty</span>
    </div>
  );
}

export function MemberLegend() {
  return (
    <div className="legend">
      <span data-ci="member user">user</span>
      <span data-ci="member bot">bot</span>
      <span data-ci="member site-admin">site admin</span>
    </div>
  );
}

export function IssueLegend({ kind }: { kind: 'issue' | 'pr' }) {
  return (
    <div className="legend">
      <span data-ci={`${kind} open`}>open</span>
      <span data-ci={`${kind} closed`}>closed</span>
      <span data-ci="stale">stale</span>
      <span data-ci="busy">busy</span>
    </div>
  );
}

export function ReleaseLegend() {
  return (
    <div className="legend">
      <span data-ci="release stable">stable</span>
      <span data-ci="release prerelease">pre</span>
      <span data-ci="release draft">draft</span>
      <span data-ci="release old">old</span>
    </div>
  );
}

export function TagLegend() {
  return (
    <div className="legend">
      <span data-ci="tag version">version</span>
      <span data-ci="tag other">other</span>
    </div>
  );
}
