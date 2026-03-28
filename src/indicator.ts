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
			if (hasUnread) {
				if (!this.hasUnreadBadge) {
					this.hasUnreadBadge = new St.Widget({
						styleClass: "geary-indicator-unread",
						translationX: 8,
						translationY: 6,
						xAlign: Clutter.ActorAlign.END,
						yAlign: Clutter.ActorAlign.END,
					});
				}
				this.add_child(this.hasUnreadBadge);
			} else {
				if (this.hasUnreadBadge) this.remove_child(this.hasUnreadBadge);
			}
		}
	},
);

export const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {
		private conn: Gio.DBusConnection | null;
		// begin-remove
		private hasUnread: boolean;
		private icon: null | typeof IndicatorIcon.prototype = null;
		private sourceAddId: null | number = null;
		private sourceRemoved: null | number = null;
		// end-remove
		constructor(
			menuAlignment: number,
			nameText: string,
			dontCreateMenu?: boolean,
		) {
			super(menuAlignment, nameText, dontCreateMenu);

			this.conn = Gio.bus_get_sync(Gio.BusType.SESSION, null);

			// Get geary notifications
			this.hasUnread = Main.messageTray.getSources().some((source) => {
				const policyId = source.policy.id;

				return policyId === GEARY_ID;
			});

			this.icon = new IndicatorIcon(this.hasUnread);
			this.add_child(this.icon);

			// initialize the icon
			this.updateIcon();

			// Add a listener for new sources
			this.sourceAddId = Main.messageTray.connect(
				"source-added",
				(_, source) => {
					const policyId = source.policy.id;

					if (policyId === GEARY_ID) {
						if (!this.hasUnread) {
							this.hasUnread = true;
							this.updateIcon();
						}
					}
				},
			);

			this.sourceRemoved = Main.messageTray.connect(
				"source-removed",
				(_, source) => {
					const policyId = source.policy.id;

					if (policyId === GEARY_ID) {
						if (this.hasUnread) {
							this.hasUnread = false;
							this.updateIcon();
						}
					}
				},
			);

			const openMailboxItem = new PopupMenu.PopupMenuItem(
				_("Open Geary Mailbox"),
			);
			openMailboxItem.connect("activate", () => {
				this.conn?.call(
					GEARY_BUS_NAME,
					GEARY_OBJECT_PATH,
					INTERFACE_APPLICATION,
					"Activate",
					new GLib.Variant("(a{sv})", [{}]),
					null,
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				);
			});
			this.menu.addMenuItem(openMailboxItem);

			const composeMessageItem = new PopupMenu.PopupMenuItem(
				_("Compose Message"),
			);
			composeMessageItem.connect("activate", () => {
				this.conn?.call(
					GEARY_BUS_NAME,
					GEARY_OBJECT_PATH,
					INTERFACE_APPLICATION,
					"ActivateAction",
					new GLib.Variant("(sava{sv})", ["compose", [], {}]),
					null,
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				);
			});
			this.menu.addMenuItem(composeMessageItem);

			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

			const preferencesItem = new PopupMenu.PopupMenuItem(_("Preferences"));
			preferencesItem.connect("activate", () => {
				this.conn?.call(
					GEARY_BUS_NAME,
					GEARY_OBJECT_PATH,
					INTERFACE_APPLICATION,
					"ActivateAction",
					new GLib.Variant("(sava{sv})", ["preferences", [], {}]),
					null,
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				);
			});
			this.menu.addMenuItem(preferencesItem);

			const accountsItem = new PopupMenu.PopupMenuItem(_("Accounts"));
			accountsItem.connect("activate", () => {
				this.conn?.call(
					GEARY_BUS_NAME,
					GEARY_OBJECT_PATH,
					INTERFACE_APPLICATION,
					"ActivateAction",
					new GLib.Variant("(sava{sv})", ["accounts", [], {}]),
					null,
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				);
			});
			this.menu.addMenuItem(accountsItem);

			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

			const quitItem = new PopupMenu.PopupMenuItem(_("Quit Geary"));
			quitItem.connect("activate", () => {
				this.conn?.call(
					GEARY_BUS_NAME,
					GEARY_OBJECT_PATH,
					INTERFACE_APPLICATION,
					"ActivateAction",
					new GLib.Variant("(sava{sv})", ["quit", [], {}]),
					null,
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				);
			});
			this.menu.addMenuItem(quitItem);
		}

		public destroy() {
			this.conn = null;

			this.icon?.destroy();
			this.icon = null;
			if (this.sourceAddId) {
				Main.messageTray.disconnect(this.sourceAddId);
				this.sourceAddId = null;
			}
			if (this.sourceRemoved) {
				Main.messageTray.disconnect(this.sourceRemoved);
				this.sourceRemoved = null;
			}

			super.destroy();
		}

		private updateIcon() {
			this.icon?.setHasUnread(this.hasUnread);
		}
	},
);
