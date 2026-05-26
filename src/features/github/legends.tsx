export function CiLegend() {
  return (
    <div className="legend" aria-label="CI status legend">
      <span data-ci="success">success</span>
      <span data-ci="failure">failure</span>
      <span data-ci="running">running</span>
      <span data-ci="none">none</span>
    </div>
  );
}

export function IssueLegend({ kind }: { kind: 'issue' | 'pr' }) {
  return (
    <div className="legend" aria-label={`${kind} legend`}>
      <span data-ci={`${kind} open`}>open</span>
      <span data-ci={`${kind} closed`}>closed</span>
      <span data-ci="stale">stale</span>
      <span data-ci="busy">busy</span>
    </div>
  );
}

export function ReleaseLegend() {
  return (
    <div className="legend" aria-label="release legend">
      <span data-ci="release stable">stable</span>
      <span data-ci="release prerelease">pre</span>
      <span data-ci="release draft">draft</span>
      <span data-ci="release old">old</span>
    </div>
  );
}

export function TagLegend() {
  return (
    <div className="legend" aria-label="tag legend">
      <span data-ci="tag version">version</span>
      <span data-ci="tag other">other</span>
    </div>
  );
}
