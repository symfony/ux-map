import { Controller } from '@hotwired/stimulus';

class default_1 extends Controller {
    constructor() {
        super(...arguments);
        this.markers = new Map();
        this.infoWindows = [];
        this.polygons = new Map();
        this.polylines = new Map();
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
    }
    createMarker(definition) {
        this.dispatchEvent('marker:before-create', { definition });
        const marker = this.doCreateMarker(definition);
        this.dispatchEvent('marker:after-create', { marker });
        marker['@id'] = definition['@id'];
        this.markers.set(definition['@id'], marker);
        return marker;
    }
    createPolygon(definition) {
        this.dispatchEvent('polygon:before-create', { definition });
        const polygon = this.doCreatePolygon(definition);
        this.dispatchEvent('polygon:after-create', { polygon });
        polygon['@id'] = definition['@id'];
        this.polygons.set(definition['@id'], polygon);
        return polygon;
    }
    createPolyline(definition) {
        this.dispatchEvent('polyline:before-create', { definition });
        const polyline = this.doCreatePolyline(definition);
        this.dispatchEvent('polyline:after-create', { polyline });
        polyline['@id'] = definition['@id'];
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
        if (!this.map) {
            return;
        }
        this.markers.forEach((marker) => {
            if (!this.markersValue.find((m) => m['@id'] === marker['@id'])) {
                this.removeMarker(marker);
                this.markers.delete(marker['@id']);
            }
        });
        this.markersValue.forEach((marker) => {
            if (!this.markers.has(marker['@id'])) {
                this.createMarker(marker);
            }
        });
        if (this.fitBoundsToMarkersValue) {
            this.doFitBoundsToMarkers();
        }
    }
    polygonsValueChanged() {
        if (!this.map) {
            return;
        }
        this.polygons.forEach((polygon) => {
            if (!this.polygonsValue.find((p) => p['@id'] === polygon['@id'])) {
                this.removePolygon(polygon);
                this.polygons.delete(polygon['@id']);
            }
        });
        this.polygonsValue.forEach((polygon) => {
            if (!this.polygons.has(polygon['@id'])) {
                this.createPolygon(polygon);
            }
        });
    }
    polylinesValueChanged() {
        if (!this.map) {
            return;
        }
        this.polylines.forEach((polyline) => {
            if (!this.polylinesValue.find((p) => p['@id'] === polyline['@id'])) {
                this.removePolyline(polyline);
                this.polylines.delete(polyline['@id']);
            }
        });
        this.polylinesValue.forEach((polyline) => {
            if (!this.polylines.has(polyline['@id'])) {
                this.createPolyline(polyline);
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
