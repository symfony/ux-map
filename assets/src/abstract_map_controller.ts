import { Controller } from '@hotwired/stimulus';

export type Point = { lat: number; lng: number };

export type Identifier = string;
export type WithIdentifier<T extends Record<string, unknown>> = T & { '@id': Identifier };

export type MarkerDefinition<MarkerOptions, InfoWindowOptions> = WithIdentifier<{
    position: Point;
    title: string | null;
    infoWindow?: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
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
}>;

export type PolygonDefinition<PolygonOptions, InfoWindowOptions> = WithIdentifier<{
    infoWindow?: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
    points: Array<Point>;
    title: string | null;
    /**
     * Raw options passed to the marker constructor, specific to the map provider (e.g.: `L.marker()` for Leaflet).
     */
    rawOptions?: PolygonOptions;
    /**
     * Extra data defined by the developer.
     * They are not directly used by the Stimulus controller, but they can be used by the developer with event listeners:
     *    - `ux:map:polygon:before-create`
     *    - `ux:map:polygon:after-create`
     */
    extra: Record<string, unknown>;
}>;

export type PolylineDefinition<PolylineOptions, InfoWindowOptions> = WithIdentifier<{
    infoWindow?: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
    points: Array<Point>;
    title: string | null;
    /**
     * Raw options passed to the marker constructor, specific to the map provider (e.g.: `L.marker()` for Leaflet).
     */
    rawOptions?: PolylineOptions;
    /**
     * Extra data defined by the developer.
     * They are not directly used by the Stimulus controller, but they can be used by the developer with event listeners:
     *    - `ux:map:polyline:before-create`
     *    - `ux:map:polyline:after-create`
     */
    extra: Record<string, unknown>;
}>;

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

export type InfoWindowWithoutPositionDefinition<InfoWindowOptions> = Omit<
    InfoWindowDefinition<InfoWindowOptions>,
    'position'
>;

export default abstract class<
    MapOptions,
    Map,
    MarkerOptions,
    Marker,
    InfoWindowOptions,
    InfoWindow,
    PolygonOptions,
    Polygon,
    PolylineOptions,
    Polyline,
> extends Controller<HTMLElement> {
    static values = {
        providerOptions: Object,
        center: Object,
        zoom: Number,
        fitBoundsToMarkers: Boolean,
        markers: Array,
        polygons: Array,
        polylines: Array,
        options: Object,
    };

    declare centerValue: Point | null;
    declare zoomValue: number | null;
    declare fitBoundsToMarkersValue: boolean;
    declare markersValue: Array<MarkerDefinition<MarkerOptions, InfoWindowOptions>>;
    declare polygonsValue: Array<PolygonDefinition<PolygonOptions, InfoWindowOptions>>;
    declare polylinesValue: Array<PolylineDefinition<PolylineOptions, InfoWindowOptions>>;
    declare optionsValue: MapOptions;

    protected map: Map;
    protected markers = new Map<Identifier, Marker>();
    protected polygons = new Map<Identifier, Polygon>();
    protected polylines = new Map<Identifier, Polyline>();
    protected infoWindows: Array<InfoWindow> = [];

    private isConnected = false;

    protected abstract dispatchEvent(name: string, payload: Record<string, unknown>): void;

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

    //region Public API
    public createMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker {
        this.dispatchEvent('marker:before-create', { definition });
        const marker = this.doCreateMarker(definition);
        this.dispatchEvent('marker:after-create', { marker });

        this.markers.set(definition['@id'], marker);

        return marker;
    }

    public createPolygon(definition: PolygonDefinition<PolygonOptions, InfoWindowOptions>): Polygon {
        this.dispatchEvent('polygon:before-create', { definition });
        const polygon = this.doCreatePolygon(definition);
        this.dispatchEvent('polygon:after-create', { polygon });

        this.polygons.set(definition['@id'], polygon);

        return polygon;
    }

    public createPolyline(definition: PolylineDefinition<PolylineOptions, InfoWindowOptions>): Polyline {
        this.dispatchEvent('polyline:before-create', { definition });
        const polyline = this.doCreatePolyline(definition);
        this.dispatchEvent('polyline:after-create', { polyline });

        this.polylines.set(definition['@id'], polyline);

        return polyline;
    }

    public createInfoWindow({
        definition,
        element,
    }: {
        definition: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
        element: Marker | Polygon | Polyline;
    }): InfoWindow {
        this.dispatchEvent('info-window:before-create', { definition, element });
        const infoWindow = this.doCreateInfoWindow({ definition, element });
        this.dispatchEvent('info-window:after-create', { infoWindow, element });

        this.infoWindows.push(infoWindow);

        return infoWindow;
    }
    //endregion

    //region Hooks called by Stimulus when the values change
    public abstract centerValueChanged(): void;

    public abstract zoomValueChanged(): void;

    public markersValueChanged(): void {
        if (!this.isConnected) {
            return;
        }

        const idsToRemove = new Set(this.markers.keys());
        this.markersValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });

        idsToRemove.forEach((id) => {
            // biome-ignore lint/style/noNonNullAssertion: the ids are coming from the keys of the map
            const marker = this.markers.get(id)!;
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

    public polygonsValueChanged(): void {
        if (!this.isConnected) {
            return;
        }

        const idsToRemove = new Set(this.polygons.keys());
        this.polygonsValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });

        idsToRemove.forEach((id) => {
            // biome-ignore lint/style/noNonNullAssertion: the ids are coming from the keys of the map
            const polygon = this.polygons.get(id)!;
            this.doRemovePolygon(polygon);
            this.polygons.delete(id);
        });

        this.polygonsValue.forEach((definition) => {
            if (!this.polygons.has(definition['@id'])) {
                this.createPolygon(definition);
            }
        });
    }

    public polylinesValueChanged(): void {
        if (!this.isConnected) {
            return;
        }

        const idsToRemove = new Set(this.polylines.keys());
        this.polylinesValue.forEach((definition) => {
            idsToRemove.delete(definition['@id']);
        });

        idsToRemove.forEach((id) => {
            // biome-ignore lint/style/noNonNullAssertion: the ids are coming from the keys of the map
            const polyline = this.polylines.get(id)!;
            this.doRemovePolyline(polyline);
            this.polylines.delete(id);
        });

        this.polylinesValue.forEach((definition) => {
            if (!this.polylines.has(definition['@id'])) {
                this.createPolyline(definition);
            }
        });
    }
    //endregion

    //region Abstract factory methods to be implemented by the concrete classes, they are specific to the map provider
    protected abstract doCreateMap({
        center,
        zoom,
        options,
    }: {
        center: Point | null;
        zoom: number | null;
        options: MapOptions;
    }): Map;

    protected abstract doFitBoundsToMarkers(): void;

    protected abstract doCreateMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker;
    protected abstract doRemoveMarker(marker: Marker): void;

    protected abstract doCreatePolygon(definition: PolygonDefinition<PolygonOptions, InfoWindowOptions>): Polygon;
    protected abstract doRemovePolygon(polygon: Polygon): void;

    protected abstract doCreatePolyline(definition: PolylineDefinition<PolylineOptions, InfoWindowOptions>): Polyline;
    protected abstract doRemovePolyline(polyline: Polyline): void;

    protected abstract doCreateInfoWindow({
        definition,
        element,
    }: {
        definition: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
        element: Marker | Polygon | Polyline;
    }): InfoWindow;
    //endregion
}
