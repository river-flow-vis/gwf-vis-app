import { html, css, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import "gwf-vis-host";
import { GWFVisHostConfig } from "../node_modules/gwf-vis-host/types/utils/gwf-vis-host-config";

@customElement("gwf-vis-app")
export class GWFVisApp extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @state()
  config?: GWFVisHostConfig;

  async firstUpdated() {
    const configUrl = new URLSearchParams(location.search).get("configUrl");
    if (configUrl) {
      this.config = await fetch(configUrl).then((response) => response.json());
    }

    if (
      "launchQueue" in window &&
      "files" in (window as any).LaunchParams.prototype
    ) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        // Nothing to do when the queue is empty.
        if (!launchParams.files.length) {
          return;
        }
        for (const fileHandle of launchParams.files) {
          this.loadConfigFile(fileHandle);
        }
      });
    }
  }

  render() {
    return html`${when(
      this.config,
      () => html`<gwf-vis-host .config=${this.config}></gwf-vis-host>`,
      () => this.renderUI()
    )}`;
  }

  private renderUI() {
    return html`
      <div style="display: flex; height: 2.5rem; justify-content: center;">
        <img src="./icons/gwf-512x512.png" />
        <div style="font-size: 2rem; margin-left: 1rem;">GWF Vis App</div>
      </div>
      <gwf-vis-ui-button
        style="display: block; width: fit-content; margin: 0 auto;"
        @click=${() => this.loadConfigFile()}
      >
        Load Config File
      </gwf-vis-ui-button>
    `;
  }

  private async loadConfigFile(fileHandle?: FileSystemFileHandle) {
    if (!fileHandle) {
      [fileHandle] = (await (window as any).showOpenFilePicker({
        types: [
          {
            description: "GWF Vis Config File",
            accept: {
              "application/json": [".gwfvisconf"],
            },
          },
        ],
      })) as FileSystemFileHandle[];
    }
    const file = await fileHandle?.getFile();
    const jsonText = await file?.text();
    if (jsonText) {
      this.config = JSON.parse(jsonText);
    }
  }
}
