import { Controller } from '@hotwired/stimulus';

export type Point = { lat: number; lng: number };

export type MarkerDefinition<MarkerOptions, InfoWindowOptions> = {
    '@id': string;
    position: Point;
    title: string | null;
    infoWindow?: Omit<InfoWindowDefinition<InfoWindowOptions>, 'position'>;
    /**
     * Raw options passed to the marker constructor, specific to the map provider (e.g.: `L.marker()` for Leaflet).
     */
    rawOptions?: MarkerOptions;
    /**
     * Extra data defined by the developer.
     * They are not directly used by the Stimulus controller, but they can be used by the developer with event listeners:
     *    - `ux:map:marker:before-create`
     *    - `ux:map:marker:after-create`
     */
    extra: Record<string, unknown>;
};

export type PolygonDefinition<PolygonOptions, InfoWindowOptions> = {
    '@id': string;
    infoWindow?: Omit<InfoWindowDefinition<InfoWindowOptions>, 'position'>;
    points: Array<Point>;
    title: string | null;
    rawOptions?: PolygonOptions;
    extra: Record<string, unknown>;
};

export type InfoWindowDefinition<InfoWindowOptions> = {
    headerContent: string | null;
    content: string | null;
    position: Point;
    opened: boolean;
    autoClose: boolean;
    /**
     * Raw options passed to the info window constructor,
     * specific to the map provider (e.g.: `google.maps.InfoWindow()` for Google Maps).
     */
    rawOptions?: InfoWindowOptions;
    /**
     * Extra data defined by the developer.
     * They are not directly used by the Stimulus controller, but they can be used by the developer with event listeners:
     *    - `ux:map:info-window:before-create`
     *    - `ux:map:info-window:after-create`
     */
    extra: Record<string, unknown>;
};

export default abstract class<
    MapOptions,
    Map,
    MarkerOptions,
    Marker,
    InfoWindowOptions,
    InfoWindow,
    PolygonOptions,
    Polygon,
> extends Controller<HTMLElement> {
    static values = {
        providerOptions: Object,
        center: Object,
        zoom: Number,
        fitBoundsToMarkers: Boolean,
        markers: Array,
        polygons: Array,
        options: Object,
    };

    declare centerValue: Point | null;
    declare zoomValue: number | null;
    declare fitBoundsToMarkersValue: boolean;
    declare markersValue: Array<MarkerDefinition<MarkerOptions, InfoWindowOptions>>;
    declare polygonsValue: Array<PolygonDefinition<PolygonOptions, InfoWindowOptions>>;
    declare optionsValue: MapOptions;

    protected map: Map;
    protected markers = new Map<Marker>();
    protected infoWindows: Array<InfoWindow> = [];
    protected polygons = new Map<Polygon>();

    connect() {
        const options = this.optionsValue;

        this.dispatchEvent('pre-connect', { options });

        this.map = this.doCreateMap({ center: this.centerValue, zoom: this.zoomValue, options });

        this.markersValue.forEach((marker) => this.createMarker(marker));

        this.polygonsValue.forEach((polygon) => this.createPolygon(polygon));

        if (this.fitBoundsToMarkersValue) {
            this.doFitBoundsToMarkers();
        }

        this.dispatchEvent('connect', {
            map: this.map,
            markers: [...this.markers.values()],
            polygons: [...this.polygons.values()],
            infoWindows: this.infoWindows,
        });
    }

    protected abstract doCreateMap({
        center,
        zoom,
        options,
    }: {
        center: Point | null;
        zoom: number | null;
        options: MapOptions;
    }): Map;

    public createMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker {
        this.dispatchEvent('marker:before-create', { definition });
        const marker = this.doCreateMarker(definition);
        this.dispatchEvent('marker:after-create', { marker });

        marker['@id'] = definition['@id'];

        this.markers.set(definition['@id'], marker);

        return marker;
    }

    protected abstract removeMarker(marker: Marker): void;

    protected abstract doCreateMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker;

    public createPolygon(definition: PolygonDefinition<PolygonOptions, InfoWindowOptions>): Polygon {
        this.dispatchEvent('polygon:before-create', { definition });
        const polygon = this.doCreatePolygon(definition);
        this.dispatchEvent('polygon:after-create', { polygon });

        polygon['@id'] = definition['@id'];

        this.polygons.set(definition['@id'], polygon);

        return polygon;
    }

    protected abstract doCreatePolygon(definition: PolygonDefinition<PolygonOptions, InfoWindowOptions>): Polygon;

    protected createInfoWindow({
        definition,
        element,
    }: {
        definition:
            | MarkerDefinition<MarkerOptions, InfoWindowOptions>['infoWindow']
            | PolygonDefinition<PolygonOptions, InfoWindowOptions>['infoWindow'];
        element: Marker | Polygon;
    }): InfoWindow {
        this.dispatchEvent('info-window:before-create', { definition, element });
        const infoWindow = this.doCreateInfoWindow({ definition, element });
        this.dispatchEvent('info-window:after-create', { infoWindow, element });

        this.infoWindows.push(infoWindow);

        return infoWindow;
    }

    protected abstract doCreateInfoWindow({
        definition,
        element,
    }:
        | {
              definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>['infoWindow'];
              element: Marker;
          }
        | {
              definition: PolygonDefinition<PolygonOptions, InfoWindowOptions>['infoWindow'];
              element: Polygon;
          }): InfoWindow;

    protected abstract doFitBoundsToMarkers(): void;

    protected abstract dispatchEvent(name: string, payload: Record<string, unknown>): void;

    public abstract centerValueChanged(): void;

    public abstract zoomValueChanged(): void;

    public markersValueChanged(): void {
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

    public polygonsValueChanged(): void {
        if (!this.map) {
            return;
        }

        this.polygons.forEach((polygon) => {
            if (!this.polygonsValue.find((p) => p['@id'] === polygon['@id'])) {
                polygon.remove();
                this.polygons.delete(polygon['@id']);
            }
        });

        this.polygonsValue.forEach((polygon) => {
            if (!this.polygons.has(polygon['@id'])) {
                this.createPolygon(polygon);
            }
        });
    }
}
