import { html } from 'lit';

export const editorStyles = html`
      <style>
        .switch-label {
          padding-left: 14px;
        }
        .switch-container.locked .switch-label {
          opacity: 0.5;
        }
        .switch-container {
          margin-bottom: 12px;
        }
        .page-container {
	  display: none;
        }
        .page-container.active {
          display: block;
        }
        .time-container {
          display: flex;
          flex-direction: row;
          margin-bottom: 12px;
        }
        .icon-container {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          margin-bottom: 12px;
        }
        .switch-right {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .textfield-container {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
	  gap: 20px;
        }
        .radio-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .radio-container.group-spacing,
        .select-row.group-spacing {
          margin-top: 16px;
        }
        /* Native controls: HA loads ha-radio and ha-checkbox only for its own
           screens, so in a card editor they can be undefined and render nothing. */
        .select-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
        }
        .select-row[hidden] {
          display: none;
        }
        .native-select {
          flex: 1;
          padding: 8px;
          font-size: 14px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }
        .native-checkbox {
          width: 18px;
          height: 18px;
          margin: 8px;
          accent-color: var(--primary-color);
        }
        .radio-group {
          display: flex;
          align-items: center;
        }
        .radio-group label {
          margin-left: 4px;
        }
        .buttons-container {
          display: flex;
          gap: 4px;
          border-bottom: 2px solid var(--divider-color);
          margin: 20px 0;
        }
        .page-button {
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 12px 16px;
          cursor: pointer;
          color: var(--secondary-text-color);
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s ease;
          outline: none;
        }
        .page-button:hover {
          background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
          color: var(--primary-text-color);
        }
        .page-button.active {
          border-bottom-color: var(--primary-color);
          color: var(--primary-color);
          font-weight: 500;
        }
        .flex-container {
          display: flex;
          flex-direction: row;
          gap: 20px;
        }
        .flex-container ha-textfield {
          flex-basis: 50%;
          flex-grow: 1;
        }
        .field-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .experimental-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-transform: uppercase;
          background: rgba(255, 152, 0, 0.2);
          color: rgb(245, 124, 0);
          border: 1px solid rgba(255, 152, 0, 0.5);
        }
        .adaptive-note {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: -8px;
        }
      </style>
`;
