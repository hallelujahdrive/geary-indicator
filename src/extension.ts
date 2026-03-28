import {
	gettext as _,
	Extension,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Indicator } from "./indicator.js";

export default class GearyIndicator extends Extension {
	private _indicator: null | typeof Indicator.prototype = null;

	public disable() {
		this._indicator?.destroy();
		this._indicator = null;
	}

	public enable() {
		if (this._indicator) {
			return;
		}

		this._indicator = new Indicator(0.5, _("Geary Indicator"));
		Main.panel.addToStatusArea(this.uuid, this._indicator);
	}
}
