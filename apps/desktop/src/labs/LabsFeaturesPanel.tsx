import React from 'react';
import type { LabFeatureId } from '../../electron/shared/types';
import { LAB_FEATURE_META } from '../surface-tiers';
import { labsCopy, settingsCopy } from '../copy/surfaces';
import { useLabs } from './labs-context';

const VOICE_IMAGE_FEATURES: LabFeatureId[] = ['voice_realtime', 'image_gen'];
const PREVIEW_CANVAS_FEATURES: LabFeatureId[] = ['preview_canvas'];

export const LabsFeaturesPanel: React.FC = () => {
  const { labs, hydrated, isFeatureEnabled, setMasterEnabled, setFeatureEnabled } = useLabs();
  const masterOn = hydrated && labs.enabled === true;

  return (
    <div className="settingsLabsPanel">
      <div className="labsRow">
        <div className="labsRow__title">
          <span>{labsCopy.masterLabel}</span>
        </div>
        <p className="settingsFieldRow__hint">{labsCopy.masterHint}</p>
        <p className="settingsFieldRow__hint">{labsCopy.masterWarning}</p>
        <label className="labsRow__toggle">
          <input
            type="checkbox"
            checked={masterOn}
            disabled={!hydrated}
            aria-label={labsCopy.masterLabel}
            onChange={(event) => void setMasterEnabled(event.target.checked)}
          />
          <span>{labsCopy.masterLabel}</span>
        </label>
      </div>

      {!masterOn ? (
        <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>{settingsCopy.voiceImageLabsGate}</p>
      ) : (
        <>
          {VOICE_IMAGE_FEATURES.map((id) => {
            const meta = LAB_FEATURE_META[id];
            const enabled = isFeatureEnabled(id);
            return (
              <div key={id} className="labsRow">
                <div className="labsRow__title">
                  <span>{meta.label}</span>
                </div>
                <p className="settingsFieldRow__hint">{meta.blurb}</p>
                <label className="labsRow__toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={!hydrated || !masterOn}
                    aria-label={`${labsCopy.featureEnableLabel}: ${meta.label}`}
                    onChange={(event) => void setFeatureEnabled(id, event.target.checked)}
                  />
                  <span>{labsCopy.featureEnableLabel}</span>
                </label>
                {!enabled ? (
                  <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
                    {settingsCopy.voiceImageFeatureBlocked(id)}
                  </p>
                ) : null}
              </div>
            );
          })}
          {PREVIEW_CANVAS_FEATURES.map((id) => {
            const meta = LAB_FEATURE_META[id];
            const enabled = isFeatureEnabled(id);
            return (
              <div key={id} className="labsRow">
                <div className="labsRow__title">
                  <span>{meta.label}</span>
                </div>
                <p className="settingsFieldRow__hint">{meta.blurb}</p>
                <label className="labsRow__toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={!hydrated || !masterOn}
                    aria-label={`${labsCopy.featureEnableLabel}: ${meta.label}`}
                    onChange={(event) => void setFeatureEnabled(id, event.target.checked)}
                  />
                  <span>{labsCopy.featureEnableLabel}</span>
                </label>
                {!enabled ? (
                  <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
                    {settingsCopy.previewCanvasFeatureBlocked}
                  </p>
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
