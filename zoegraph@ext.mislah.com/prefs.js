const ExtensionUtils = imports.misc.extensionUtils;
const Self = ExtensionUtils.getCurrentExtension();
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const PrefsWidget = GObject.registerClass({
    GTypeName: 'PrefsWidgets',
    Template: Self.dir.get_child('settings.ui').get_uri(),
    InternalChildren: [
        'c_off_x',
        'c_off_y',
        'z_off_x',
        'z_off_y',
        'clock_24h',
        'default_mode',
        'zoegraph_date',
    ],
}, class PrefsWidget extends Gtk.Box {

    _init(params = {}) {
        super._init(params);
        this._settings = ExtensionUtils.getSettings(Self.metadata['settings-schema']);
        this._bind('offset-clock-x', 'c_off_x', 'value');
        this._bind('offset-clock-y', 'c_off_y', 'value');
        this._bind('offset-zoegraph-x', 'z_off_x', 'value');
        this._bind('offset-zoegraph-y', 'z_off_y', 'value');
        this._bind('clock-24h', 'clock_24h', 'active');
        
        const defaultMode = this._widget('default_mode');
        defaultMode.set_active(this._settings.get_enum('mode'));
        defaultMode.connect('changed', (combobox) => {
            this._settings.set_enum('mode', combobox.get_active());
        });

        const zoeDate = this._widget('zoegraph_date');
        zoeDate.set_text(this._settings.get_string('zoegraph-anchor-date'));
        zoeDate.connect('changed', (entry) => {
            this._settings.set_string('zoegraph-anchor-date', entry.get_text());
        });
    }

    _widget(id) {
        const name = '_' + id;
        if (!this[name]) {
            throw `Unknown widget with ID "${id}"!`;
        }

        return this[name];
    }

    _bind(settingsKey, widgetId, widgetProperty, flag = Gio.SettingsBindFlags.DEFAULT) {
        const widget = this._widget(widgetId);
        this._settings.bind(settingsKey, widget, widgetProperty, flag);
        this._settings.bind_writable(settingsKey, widget, 'sensitive', false);
    }

    _bindWidgetSensitive(widgetId, settingsKey, invert = false) {
        this._settings.connect(
            'changed::' + settingsKey,
            () => this._updateWidgetSensitive(widgetId, settingsKey, invert),
        );
        this._updateWidgetSensitive(widgetId, settingsKey, invert);
    }

    _updateWidgetSensitive(widgetId, settingsKey, invert) {
        const active = this._settings.get_boolean(settingsKey);
        this._widget(widgetId).set_sensitive(invert ? !active : active);
    }
});

function init() {
    ExtensionUtils.initTranslations('zoegraph');
}

function buildPrefsWidget() {
    return new PrefsWidget();
}
