import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

const GEARY_BUS_NAME = "org.gnome.Geary";
const GEARY_ID = "org.gnome.Geary";
const GEARY_OBJECT_PATH = "/org/gnome/Geary";
const INTERFACE_APPLICATION = "org.freedesktop.Application";

function activateGeary() {
	callGeary("Activate", new GLib.Variant("(a{sv})", [{}]));
}

function activateGearyAction(action: string) {
	callGeary("ActivateAction", new GLib.Variant("(sava{sv})", [action, [], {}]));
}

function callGeary(method: string, parameters: GLib.Variant) {
	Gio.bus_get_sync(Gio.BusType.SESSION, null)?.call(
		GEARY_BUS_NAME,
		GEARY_OBJECT_PATH,
		INTERFACE_APPLICATION,
		method,
		parameters,
		null,
		Gio.DBusCallFlags.NONE,
		-1,
		null,
	);
}

function gearyHasUnread() {
	return Main.messageTray.getSources().some(isGearySource);
}

function isGearySource(source: { policy: { id: string } }) {
	return source.policy.id === GEARY_ID;
}

const IndicatorIcon = GObject.registerClass(
	class IndicatorIcon extends St.Widget {
		private hasUnreadBadge: null | St.Widget = null;
		private icon: null | St.Icon = null;

		constructor(hasUnread: boolean) {
			super({
				layoutManager: new Clutter.BinLayout(),
			});

			this.icon = new St.Icon({
				iconName: "mail-unread-symbolic",
				styleClass: "system-status-icon",
			});

			this.add_child(this.icon);

			this.setHasUnread(hasUnread);
		}

		public destroy() {
			this.hasUnreadBadge?.destroy();
			this.hasUnreadBadge = null;

			this.icon?.destroy();
			this.icon = null;

			super.destroy();
		}

		public setHasUnread(hasUnread: boolean) {
			if (hasUnread === !!this.hasUnreadBadge) return;

			if (hasUnread) {
				this.hasUnreadBadge = new St.Widget({
					styleClass: "geary-indicator-unread",
					translationX: 8,
					translationY: 6,
					xAlign: Clutter.ActorAlign.END,
					yAlign: Clutter.ActorAlign.END,
				});
				this.add_child(this.hasUnreadBadge);
			} else {
				this.hasUnreadBadge?.destroy();
				this.hasUnreadBadge = null;
			}
		}
	},
);

export const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {
		declare private icon: null | typeof IndicatorIcon.prototype;
		declare private sourceAddedId: null | number;
		declare private sourceRemovedId: null | number;

		constructor(
			menuAlignment: number,
			nameText: string,
			dontCreateMenu?: boolean,
		) {
			super(menuAlignment, nameText, dontCreateMenu);

			this.icon = new IndicatorIcon(gearyHasUnread());
			this.add_child(this.icon);
			this.bindUnreadSignals();
			this.buildMenu();
		}

		public destroy() {
			this.icon?.destroy();
			this.icon = null;
			if (this.sourceAddedId) {
				Main.messageTray.disconnect(this.sourceAddedId);
				this.sourceAddedId = null;
			}
			if (this.sourceRemovedId) {
				Main.messageTray.disconnect(this.sourceRemovedId);
				this.sourceRemovedId = null;
			}

			super.destroy();
		}

		private addMenuAction(label: string, activate: () => void) {
			const item = new PopupMenu.PopupMenuItem(label);
			item.connect("activate", activate);
			this.menu.addMenuItem(item);
		}

		private bindUnreadSignals() {
			this.sourceAddedId = Main.messageTray.connect(
				"source-added",
				(_, source) => {
					if (isGearySource(source)) this.syncUnread();
				},
			);
			this.sourceRemovedId = Main.messageTray.connect(
				"source-removed",
				(_, source) => {
					if (isGearySource(source)) this.syncUnread();
				},
			);
		}

		private buildMenu() {
			this.addMenuAction(_("Open Geary Mailbox"), () => activateGeary());
			this.addMenuAction(_("Compose Message"), () =>
				activateGearyAction("compose"),
			);
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			this.addMenuAction(_("Preferences"), () =>
				activateGearyAction("preferences"),
			);
			this.addMenuAction(_("Accounts"), () => activateGearyAction("accounts"));
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			this.addMenuAction(_("Quit Geary"), () => activateGearyAction("quit"));
		}

		private syncUnread() {
			this.icon?.setHasUnread(gearyHasUnread());
		}
	},
);
