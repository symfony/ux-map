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
    private createMarker: ({
        definition,
    }: { definition: MarkerDefinition<MarkerOptions, InfoWindowOptions> }) => Marker;
    private createPolygon: ({
        definition,
    }: { definition: PolygonDefinition<PolygonOptions, InfoWindowOptions> }) => Polygon;
    private createPolyline: ({
        definition,
    }: { definition: PolylineDefinition<PolylineOptions, InfoWindowOptions> }) => Polyline;

    protected abstract dispatchEvent(name: string, payload: Record<string, unknown>): void;

    connect() {
        const options = this.optionsValue;

        this.dispatchEvent('pre-connect', { options });

        this.createMarker = this.createDrawingFactory('marker', this.markers, this.doCreateMarker.bind(this));
        this.createPolygon = this.createDrawingFactory('polygon', this.polygons, this.doCreatePolygon.bind(this));
        this.createPolyline = this.createDrawingFactory('polyline', this.polylines, this.doCreatePolyline.bind(this));

        this.map = this.doCreateMap({ center: this.centerValue, zoom: this.zoomValue, options });
        this.markersValue.forEach((definition) => this.createMarker({ definition }));
        this.polygonsValue.forEach((definition) => this.createPolygon({ definition }));
        this.polylinesValue.forEach((definition) => this.createPolyline({ definition }));

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
                this.createMarker({ definition });
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
                this.createPolygon({ definition });
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
                this.createPolyline({ definition });
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

    protected abstract doCreateMarker({
        definition,
    }: { definition: MarkerDefinition<MarkerOptions, InfoWindowOptions> }): Marker;

    protected abstract doRemoveMarker(marker: Marker): void;

    protected abstract doCreatePolygon({
        definition,
    }: { definition: PolygonDefinition<PolygonOptions, InfoWindowOptions> }): Polygon;

    protected abstract doRemovePolygon(polygon: Polygon): void;

    protected abstract doCreatePolyline({
        definition,
    }: { definition: PolylineDefinition<PolylineOptions, InfoWindowOptions> }): Polyline;

    protected abstract doRemovePolyline(polyline: Polyline): void;

    protected abstract doCreateInfoWindow({
        definition,
        element,
    }: {
        definition: InfoWindowWithoutPositionDefinition<InfoWindowOptions>;
        element: Marker | Polygon | Polyline;
    }): InfoWindow;
    //endregion

    //region Private APIs

    private createDrawingFactory(
        type: 'marker',
        draws: typeof this.markers,
        factory: typeof this.doCreateMarker
    ): typeof this.doCreateMarker;
    private createDrawingFactory(
        type: 'polygon',
        draws: typeof this.polygons,
        factory: typeof this.doCreatePolygon
    ): typeof this.doCreatePolygon;
    private createDrawingFactory(
        type: 'polyline',
        draws: typeof this.polylines,
        factory: typeof this.doCreatePolyline
    ): typeof this.doCreatePolyline;
    private createDrawingFactory<
        Factory extends typeof this.doCreateMarker | typeof this.doCreatePolygon | typeof this.doCreatePolyline,
        Draw extends ReturnType<Factory>,
    >(
        type: 'marker' | 'polygon' | 'polyline',
        draws: globalThis.Map<WithIdentifier<any>, Draw>,
        factory: Factory
    ): Factory {
        const eventBefore = `${type}:before-create`;
        const eventAfter = `${type}:after-create`;

        // @ts-expect-error IDK what to do with this error
        // 'Factory' could be instantiated with an arbitrary type which could be unrelated to '({ definition }: { definition: WithIdentifier<any>; }) => Draw'
        return ({ definition }: { definition: WithIdentifier<any> }) => {
            this.dispatchEvent(eventBefore, { definition });
            const drawing = factory(definition) as Draw;
            this.dispatchEvent(eventAfter, { [type]: drawing });

            draws.set(definition['@id'], drawing);

            return drawing;
        };
    }
    //endregion
}
