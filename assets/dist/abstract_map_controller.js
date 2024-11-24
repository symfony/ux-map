import { Controller } from '@hotwired/stimulus';

class default_1 extends Controller {
    constructor() {
        super(...arguments);
        this.markers = new Map();
        this.polygons = new Map();
        this.polylines = new Map();
        this.infoWindows = [];
        this.isConnected = false;
    }
    connect() {
        const options = this.optionsValue;
        this.dispatchEvent('pre-connect', { options });
        this.map = this.doCreateMap({ center: this.centerValue, zoom: this.zoomValue, options });
        this.markersValue.forEach((marker) => this.createMarker(marker));
        this.polygonsValue.forEach((polygon) => this.createPolygon(polygon));
        this.polylinesValue.forEach((polyline) => this.createPolyline(polyline));
        if (this.fitBoundsToMarkersValue) {
            this.doFitBoundsToMarkers();
        }
        this.dispatchEvent('connect', {
            map: this.map,
            markers: [...this.markers.values()],
            polygons: [...this.polygons.values()],
            polylines: [...this.polylines.values()],
            infoWindows: this.infoWindows,
        });
        this.isConnected = true;
    }
    createMarker(definition) {
        this.dispatchEvent('marker:before-create', { definition });
        const marker = this.doCreateMarker(definition);
        this.dispatchEvent('marker:after-create', { marker });
        this.markers.set(definition['@id'], marker);
        return marker;
    }
    createPolygon(definition) {
        this.dispatchEvent('polygon:before-create', { definition });
        const polygon = this.doCreatePolygon(definition);
        this.dispatchEvent('polygon:after-create', { polygon });
        this.polygons.set(definition['@id'], polygon);
        return polygon;
    }
    createPolyline(definition) {
        this.dispatchEvent('polyline:before-create', { definition });
        const polyline = this.doCreatePolyline(definition);
        this.dispatchEvent('polyline:after-create', { polyline });
        this.polylines.set(definition['@id'], polyline);
        return polyline;
    }
    createInfoWindow({ definition, element, }) {
        this.dispatchEvent('info-window:before-create', { definition, element });
        const infoWindow = this.doCreateInfoWindow({ definition, element });
        this.dispatchEvent('info-window:after-create', { infoWindow, element });
        this.infoWindows.push(infoWindow);
        return infoWindow;
    }
    markersValueChanged() {
        if (!this.isConnected) {
            return;
        }
        const idsToRemove = new Set(this.markers.keys());
        this.markersValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });
        idsToRemove.forEach((id) => {
            const marker = this.markers.get(id);
            this.doRemoveMarker(marker);
            this.markers.delete(id);
        });
        this.markersValue.forEach((definition) => {
            if (!this.markers.has(definition['@id'])) {
                this.createMarker(definition);
            }
        });
        if (this.fitBoundsToMarkersValue) {
            this.doFitBoundsToMarkers();
        }
    }
    polygonsValueChanged() {
        if (!this.isConnected) {
            return;
        }
        const idsToRemove = new Set(this.polygons.keys());
        this.polygonsValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });
        idsToRemove.forEach((id) => {
            const polygon = this.polygons.get(id);
            this.doRemovePolygon(polygon);
            this.polygons.delete(id);
        });
        this.polygonsValue.forEach((definition) => {
            if (!this.polygons.has(definition['@id'])) {
                this.createPolygon(definition);
            }
        });
    }
    polylinesValueChanged() {
        if (!this.isConnected) {
            return;
        }
        const idsToRemove = new Set(this.polylines.keys());
        this.polylinesValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });
        idsToRemove.forEach((id) => {
            const polyline = this.polylines.get(id);
            this.doRemovePolyline(polyline);
            this.polylines.delete(id);
        });
        this.polylinesValue.forEach((definition) => {
            if (!this.polylines.has(definition['@id'])) {
                this.createPolyline(definition);
            }
        });
    }
}
default_1.values = {
    providerOptions: Object,
    center: Object,
    zoom: Number,
    fitBoundsToMarkers: Boolean,
    markers: Array,
    polygons: Array,
    polylines: Array,
    options: Object,
};

export { default_1 as default };
