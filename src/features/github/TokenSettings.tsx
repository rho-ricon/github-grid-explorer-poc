import { useEffect, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { useGitHubAuth } from './auth';

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

            <input
              className="tokenInput"
              type="password"
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
              placeholder="github_pat_…"
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
