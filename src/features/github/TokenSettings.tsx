import { useEffect, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { ORG } from './api';
import { useGitHubAuth } from './auth';

const TOKEN_EXPIRATION_DAYS = 7;

export function TokenSettings() {
  const { token, rememberToken, saveToken, clearToken } = useGitHubAuth();
  const [draftToken, setDraftToken] = useState(token);
  const [remember, setRemember] = useState(rememberToken);

  useEffect(() => {
    setDraftToken(token);
    setRemember(rememberToken);
  }, [token, rememberToken]);

  return (
    <Popover.Root>
      <Popover.Trigger className="tokenButton">{token ? 'Token set' : 'Token'}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="popoverPositioner" side="bottom" align="end" sideOffset={8}>
          <Popover.Popup className="tokenPopover">
            <Popover.Title className="tokenTitle">GitHub token</Popover.Title>
            <Popover.Description className="tokenDescription">
              Optional. Use a fine-grained read-only token. Remembering stores it in this browser’s
              localStorage on this device.
            </Popover.Description>

            <a
              className="tokenLink"
              href={fineGrainedTokenUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Create {TOKEN_EXPIRATION_DAYS}-day read-only token
            </a>

            <input
              className="tokenInput"
              type="password"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
              placeholder="Paste token here"
              autoComplete="off"
            />

            <label className="rememberToken">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember on this device
            </label>

            <div className="tokenActions">
              <Popover.Close className="back" onClick={() => saveToken(draftToken, remember)}>
                Save
              </Popover.Close>
              <Popover.Close className="back" onClick={clearToken}>
                Clear
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function fineGrainedTokenUrl() {
  const url = new URL('https://github.com/settings/personal-access-tokens/new');

  url.searchParams.set('name', 'GitHub Grid Explorer');
  url.searchParams.set('description', 'Read-only token for GitHub Grid Explorer');
  url.searchParams.set('target_name', ORG);
  url.searchParams.set('expires_in', String(TOKEN_EXPIRATION_DAYS));

  // Repository permissions used by this app.
  url.searchParams.set('actions', 'read');
  url.searchParams.set('contents', 'read');
  url.searchParams.set('issues', 'read');
  url.searchParams.set('pull_requests', 'read');
  url.searchParams.set('metadata', 'read');

  // Organization permission used for teams/members.
  url.searchParams.set('members', 'read');

  return url.toString();
}
