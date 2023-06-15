import { Config } from './config';
import { fnConsoleLog } from './fn.console.log';

export type BrowserGlobalSender = browser.runtime.MessageSender | chrome.runtime.MessageSender;
export type BrowserGlobal = typeof chrome | typeof browser;
export type BrowserRuntime = typeof chrome.runtime | typeof browser.runtime;
export type BrowserTabs = typeof chrome.tabs | typeof browser.tabs;
export type BrowserTab = chrome.tabs.Tab | browser.tabs.Tab;
export type BrowserTabObject = chrome.tabs.Tab | browser.tabs.Tab;
export type BrowserLocalStore = typeof chrome.storage.local | typeof browser.storage.local;
export type BrowserDownloads = typeof chrome.downloads | typeof browser.downloads;
export type BrowserAction = typeof chrome.action | typeof browser.browserAction;
export type BrowserTabChangeInfo = chrome.tabs.TabChangeInfo | browser.tabs._OnUpdatedChangeInfo;

export interface BusMessage<T> {
  type: string;
  data?: T;
}

export class BrowserApi {
  private static browserApi: BrowserGlobal;
  private static isChromeValue = false;

  static init() {
    if (this.browserApi) return;
    try {
      this.browserApi = browser;
    } catch (e) {
      this.browserApi = chrome;
      this.isChromeValue = true;
    }
  }

  static get isChrome(): boolean {
    return this.isChromeValue;
  }

  static get browser(): BrowserGlobal {
    return this.browserApi;
  }

  static get runtime(): BrowserRuntime {
    return this.browserApi.runtime;
  }

  static get tabs(): BrowserTabs {
    return this.browserApi.tabs;
  }

  static activeTab = async (): Promise<BrowserTab> => {
    const tabs = await this.browserApi.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  };

  static setActiveTabUrl = async (url: string): Promise<void> => {
    const tab = await this.activeTab();
    await this.browserApi.tabs.update(tab.id, { url });
  };

  static get localStore(): BrowserLocalStore {
    return this.browserApi.storage.local;
  }

  static get downloads(): BrowserDownloads {
    return this.browserApi.downloads;
  }

  static get browserAction(): BrowserAction {
    if (this.isChromeValue) return this.browserApi.action;
    return this.browserApi.browserAction;
  }

  static get startUrl(): string {
    return this.isChromeValue ? 'chrome-extension' : 'moz-extension';
  }

  static get disabledUrl(): string {
    return this.isChromeValue ? 'chrome://' || 'chrome-extension://' : 'moz://' || 'moz-extension://';
  }

  static get runtimeUrl(): string {
    if (BrowserApi.isChrome) {
      return `chrome-extension://${chrome.runtime.id}`;
    }
    return 'moz-extension://';
  }

  static openOptionsPage(subpage = ''): void {
    if (this.isChromeValue) {
      const optionsPage = chrome.runtime.getManifest().options_ui?.page;
      if (optionsPage) window.open(`chrome-extension://${chrome.runtime.id}/${optionsPage}${subpage}`);
      return;
    }
    window.open(browser.runtime.getManifest().options_ui?.page);
    window.close();
  }

  static shadowRoot(el: Element): ShadowRoot | null {
    try {
      if (this.isChromeValue) {
        return chrome.dom.openOrClosedShadowRoot(el);
      }
      return browser.dom.openOrClosedShadowRoot(el);
    } catch (e) {
      fnConsoleLog('BrowserApiWrapper->shadowRoot->ERROR', el, e);
    }
    return null;
  }

  static sendTabMessage = <T>(msg: BusMessage<T>): Promise<void> => {
    return new Promise((resolve: (...arg: any) => void, reject: (...arg: any) => void) => {
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      /* eslint-disable @typescript-eslint/no-floating-promises */
      this.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const currentTab: BrowserTabObject | undefined = tabs[0];
        if (currentTab?.id) {
          try {
            this.tabs.sendMessage(currentTab.id, msg, resolve);
          } catch (e) {
            fnConsoleLog('Error sendTabMessage', msg, e, 'lastError', BrowserApi.runtime.lastError);
            reject(e);
          }
        }
      });
    });
  };

  static sendRuntimeMessage = async <T>(msg: BusMessage<T>): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        this.runtime.sendMessage(msg, (ack: any) => {
          if (Config.showAckMessage) fnConsoleLog(`${msg.type}->ack`);
          resolve(ack);
        });
      } catch (e) {
        fnConsoleLog('runtime.lastError', msg, e, 'lastError', BrowserApi.runtime.lastError);
        reject(e);
      }
    });
  };
}
BrowserApi.init();
