import { Drawer } from '@base-ui/react/drawer';
import { Screen } from '../../components/Screen';
import { openInGitHub } from './api';
import { formatDate } from './status';
import { TokenSettings } from './TokenSettings';
import type { RepoWithCi } from './types';

export function RepoCompareScreen({ left, right }: { left: RepoWithCi; right: RepoWithCi }) {
  return (
    <Drawer.Content className="screen">
      <Screen
        title="Compare repos"
        leading={<Drawer.Close className="back">← Back</Drawer.Close>}
        actions={<TokenSettings />}
        count={`${left.name} ↔ ${right.name}`}
      >
        <div className="comparePanel">
          <RepoCompareCard repo={left} label="Source" />
          <RepoCompareCard repo={right} label="Target" />
          <CompareSignals left={left} right={right} />
        </div>
      </Screen>
    </Drawer.Content>
  );
}

function RepoCompareCard({ repo, label }: { repo: RepoWithCi; label: string }) {
  return (
    <section className="compareCard">
      <div>
        <span className="compareKicker">{label}</span>
        <h2>{repo.name}</h2>
        <p>{repo.description || 'No description.'}</p>
      </div>

      <dl className="compareMetrics">
        <CompareMetric label="CI" value={repo.ci.label} />
        <CompareMetric label="Language" value={repo.language || 'No language'} />
        <CompareMetric label="Stars" value={repo.stargazers_count} />
        <CompareMetric label="Forks" value={repo.forks_count} />
        <CompareMetric label="Open issues" value={repo.open_issues_count} />
        <CompareMetric label="Updated" value={formatDate(repo.updated_at)} />
      </dl>

      <button className="actionButton" type="button" onClick={() => openInGitHub(repo.html_url)}>
        Open on GitHub
      </button>
    </section>
  );
}

function CompareMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="compareMetric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CompareSignals({ left, right }: { left: RepoWithCi; right: RepoWithCi }) {
  const leftUpdated = new Date(left.updated_at).getTime();
  const rightUpdated = new Date(right.updated_at).getTime();
  const newer = leftUpdated === rightUpdated ? null : leftUpdated > rightUpdated ? left : right;
  const issueDelta = left.open_issues_count - right.open_issues_count;
  const starDelta = left.stargazers_count - right.stargazers_count;

  return (
    <section className="compareCard compareSignals">
      <div>
        <span className="compareKicker">Signals</span>
        <h2>At a glance</h2>
      </div>
      <ul>
        <li>
          CI: {left.name} is {left.ci.state}; {right.name} is {right.ci.state}.
        </li>
        <li>
          Language:{' '}
          {left.language === right.language
            ? `both ${left.language || 'unspecified'}`
            : `${left.language || 'unspecified'} vs ${right.language || 'unspecified'}`}
          .
        </li>
        <li>
          Open issues:{' '}
          {issueDelta === 0
            ? 'same count'
            : `${Math.abs(issueDelta)} more in ${issueDelta > 0 ? left.name : right.name}`}
          .
        </li>
        <li>
          Stars:{' '}
          {starDelta === 0
            ? 'same count'
            : `${Math.abs(starDelta)} more for ${starDelta > 0 ? left.name : right.name}`}
          .
        </li>
        <li>{newer ? `${newer.name} was updated more recently.` : 'Updated at the same time.'}</li>
      </ul>
    </section>
  );
}
