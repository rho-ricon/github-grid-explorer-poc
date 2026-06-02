import { Drawer } from '@base-ui/react/drawer';
import { Meter } from '@base-ui/react/meter';
import type { CSSProperties, ReactNode } from 'react';
import { copyText } from '../../utils/clipboard';
import { formatDate, isStale, issueSquareStatus } from './status';
import type { IssueOrPull, Repo } from './types';

export function ItemScreen({ repo, item }: { repo: Repo; item: IssueOrPull }) {
  const kind = item.pull_request ? 'PR' : 'Issue';
  const body = item.body?.trim() || '';
  const checklist = buildChecklist(item, body);
  const doneCount = checklist.filter((check) => check.done).length;
  const attentionScore = checklist.length - doneCount;
  const updatedDays = daysSince(item.updated_at);

  return (
    <Drawer.Content className="screen">
      <header className="topbar">
        <Drawer.Close className="back">← Back</Drawer.Close>
        <Drawer.Title>
          {repo.name} / {kind} #{item.number}
        </Drawer.Title>
        <span>{item.state}</span>
      </header>

      <main className="center">
        <div className="itemWorkspace">
          <section className="itemHero itemPanel" data-state={issueSquareStatus(item)}>
            <div>
              <span className="itemKicker">{kind} dossier</span>
              <h2>{item.title}</h2>
              <p>
                #{item.number} · opened by {item.user?.login || 'unknown'} · updated{' '}
                {formatDate(item.updated_at)}
              </p>
            </div>

            <div className="itemStatusRail">
              <StatusChip state={issueSquareStatus(item)}>{item.state}</StatusChip>
              <StatusChip>{item.comments} comments</StatusChip>
              <StatusChip>{updatedDays === 0 ? 'updated today' : `${updatedDays}d old`}</StatusChip>
              <StatusChip>{item.labels.length} labels</StatusChip>
            </div>

            <div className="itemActions">
              <a className="actionButton" href={item.html_url} target="_blank" rel="noreferrer">
                Open on GitHub
              </a>
              <button
                className="actionButton"
                type="button"
                onClick={() => copyText(item.html_url)}
              >
                Copy URL
              </button>
            </div>
          </section>

          <section className="itemPanel itemReviewPanel">
            <div>
              <span className="itemKicker">Review posture</span>
              <h2>
                {attentionScore === 0 ? 'Looks low-friction' : `${attentionScore} attention flags`}
              </h2>
            </div>

            <Meter.Root
              className="itemMeter"
              value={doneCount}
              max={checklist.length}
              aria-valuetext={`${doneCount} of ${checklist.length} context checks pass`}
            >
              <div className="itemMeterHeader">
                <Meter.Label>Context readiness</Meter.Label>
                <Meter.Value>{() => `${doneCount}/${checklist.length}`}</Meter.Value>
              </div>
              <Meter.Track className="itemMeterTrack">
                <Meter.Indicator className="itemMeterIndicator" />
              </Meter.Track>
            </Meter.Root>

            <ul className="itemChecklist">
              {checklist.map((check) => (
                <li key={check.label} data-done={check.done ? 'true' : undefined}>
                  <strong>
                    {check.done ? '✓' : '□'} {check.label}
                  </strong>
                  <span>{check.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="itemPanel">
            <div>
              <span className="itemKicker">Signals</span>
              <h2>Fast read</h2>
            </div>
            <div className="itemSignalCards">
              <SignalCard
                title="Conversation"
                value={`${item.comments}`}
                detail={item.comments >= 10 ? 'Busy discussion' : 'Small enough to scan'}
                state={item.comments >= 10 ? 'warning' : 'ok'}
              />
              <SignalCard
                title="Freshness"
                value={updatedDays === 0 ? 'today' : `${updatedDays}d`}
                detail={isStale(item.updated_at) ? 'Stale open item' : 'Recently touched'}
                state={isStale(item.updated_at) ? 'warning' : 'ok'}
              />
              <SignalCard
                title="Description"
                value={body ? `${body.length}` : '0'}
                detail={body ? 'Body is available' : 'No body text'}
                state={body ? 'ok' : 'warning'}
              />
              <SignalCard
                title="Labels"
                value={`${item.labels.length}`}
                detail={item.labels.length > 0 ? 'Triage labels present' : 'No labels'}
                state={item.labels.length > 0 ? 'ok' : 'neutral'}
              />
            </div>
          </section>

          <section className="itemPanel">
            <div>
              <span className="itemKicker">Labels</span>
              <h2>{item.labels.length || 'No'} labels</h2>
            </div>
            {item.labels.length === 0 ? (
              <p>No labels are attached.</p>
            ) : (
              <div className="itemLabels">
                {item.labels.map((label) => (
                  <span
                    key={label.name}
                    style={{ '--label-color': `#${label.color}` } as CSSProperties}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="itemPanel itemBodyPanel">
            <div>
              <span className="itemKicker">Description</span>
              <h2>{body ? 'Body excerpt' : 'No body'}</h2>
            </div>
            {body ? (
              <p>{excerpt(body)}</p>
            ) : (
              <p>This {kind.toLowerCase()} has no description body in the loaded GitHub data.</p>
            )}
          </section>
        </div>
      </main>
    </Drawer.Content>
  );
}

function StatusChip({ children, state }: { children: ReactNode; state?: string }) {
  return (
    <span className="itemStatusChip" data-state={state}>
      {children}
    </span>
  );
}

function SignalCard({
  title,
  value,
  detail,
  state,
}: {
  title: string;
  value: string;
  detail: string;
  state: 'ok' | 'warning' | 'neutral';
}) {
  return (
    <article className="itemSignalCard" data-state={state}>
      <span className="itemKicker">{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function buildChecklist(item: IssueOrPull, body: string) {
  return [
    {
      label: 'Description present',
      detail: body ? `${body.length.toLocaleString()} characters` : 'missing body',
      done: body.length > 0,
    },
    {
      label: 'Fresh enough',
      detail: isStale(item.updated_at)
        ? `updated ${daysSince(item.updated_at)} days ago`
        : 'recent update',
      done: !isStale(item.updated_at),
    },
    {
      label: 'Conversation bounded',
      detail: item.comments >= 10 ? `${item.comments} comments` : `${item.comments} comments`,
      done: item.comments < 10,
    },
    {
      label: 'Triage labels present',
      detail: item.labels.length > 0 ? `${item.labels.length} labels` : 'no labels',
      done: item.labels.length > 0,
    },
  ];
}

function daysSince(value: string) {
  const updated = new Date(value).getTime();
  if (!Number.isFinite(updated)) return 0;
  return Math.max(0, Math.floor((Date.now() - updated) / (24 * 60 * 60 * 1000)));
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 900) return compact;
  return `${compact.slice(0, 900)}…`;
}
