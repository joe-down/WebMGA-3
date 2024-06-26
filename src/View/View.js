import React from "react";
import GeneralMenu from './GeneralMenu';
import VisualisationMenu from './VisualisationMenu';

export class View {
    static state;
    header;
    sidebar;
    model;
    expanded;
    ModelDefaultState = {
        active: 0, reset: 0, sets: [], configurations: [],
    }
    SlicingDefaultState = {
        clipIntersection: false,
        slicing_enabled: false,
        helpers: [false, false, false],
        x: [-80, 80],
        y: [-80, 80],
        z: [-80, 80]
    }
    ConfigurationDefaultState = {
        title: '', shape: 'Ellipsoid', parameters: {
            names: ['X', 'Y', 'Z'], vals: [1, 1, 0.2]
        }, colour: {
            r: 255, g: 255, b: 255
        }, colourFromDirector: true, displayAsWireframe: false
    }
    CameraDefaultState = {
        type: 'orthographic', lookAt: {
            x: 0, y: 0, z: 0
        }, position: {
            x: 0, y: 0, z: -15
        }, zoom: 50
    }
    PointLightDefaultState = {
        reset: 0, active: 'point', enabled: true, helper: false, colour: {
            r: 255, g: 255, b: 255, i: 60
        }, position: {
            x: 5, y: 0, z: 5
        }
    }
    DirectionalLightDefaultState = {
        reset: 0, active: 'directional', enabled: true, helper: false, colour: {
            r: 255, g: 255, b: 255, i: 50
        }, position: {
            x: -5, y: 0, z: -5
        }

    }
    ReferenceDefaultState = {
        boundingShapeEnabled: false,
        activeShape: 'box',
        showAxes: false,
        multicolour: true,
        size: 50,
        fps: 24,
        uploaded: true,
        video: false,
        loadVideoState: false,
        repeats: {x: 0, y: 0, z: 0}
    }
    AmbientLightDefaultState = {
        ambientLightColour: {
            r: 255, g: 255, b: 255, i: 40
        }, darkBackGround: true
    }

    constructor(m, io, chrono, toggler) {
        View.state = {}
        this.expanded = false;
        this.model = m;
        this.header = <GeneralMenu chronometer={chrono} functions={io} model={this.model} toggler={toggler}/>;
        this.sidebar =
            <VisualisationMenu model={this.model} functions={io} sidebarExpanded={this.expanded} toggler={toggler}/>;
    }

    getData() {
        return View.state;
    }

    setState(state, vid) {
        View.state = state;
        if (!vid) {
            this.loadLightingAndCamera(state, vid);
        }
        if (View.state.reference.repeats === undefined) {
            View.state.reference.repeats = this.ReferenceDefaultState.repeats
        }
        this.loadReferenceAndSlicing(state);
        this.loadModel(state);
    }

    loadModel(state) {
        let substate;
        for (let i in state.model.configurations) {
            substate = state.model.configurations[i];
            this.model.updateUserColour(i, substate.colour);
            this.model.toggleUserColour(i, substate.colourFromDirector);
            this.model.toggleWireframe(i, substate.displayAsWireframe);
            this.model.toggleFoldState(i, substate.displayFoldState);
            this.model.updateShape(i, substate.shape, substate.parameters);
        }
        this.model.updateBoundingShape(state.reference.activeShape, state.reference.boundingShapeEnabled)
    }

    loadState(state, vid) {
        if (!vid) {
            this.loadLightingAndCamera(state, vid);
        }
        this.loadReferenceAndSlicing(state);

    }

    loadReferenceAndSlicing(state) {
        if (this.xor(this.model.axesEnabled, state.reference.showAxes)) {
            this.model.toggleAxes();
        }
        this.model.toggleFoldState(0, state.boundingShapeEnabled);
        this.model.enableClipping(state.slicing.slicing_enabled);
        this.model.toggleHelper(0, state.slicing.helpers[0]);
        this.model.toggleHelper(1, state.slicing.helpers[1]);
        this.model.toggleHelper(2, state.slicing.helpers[2]);
        this.model.updateSlicer(0, state.slicing.x);
        this.model.updateSlicer(1, state.slicing.y);
        this.model.updateSlicer(2, state.slicing.z);

    }

    loadLightingAndCamera(state, vid) {
        console.log('called load light')
        let directionalLightColour = JSON.parse(JSON.stringify(state.directionalLight.colour));
        let pointLightColour = JSON.parse(JSON.stringify(state.pointLight.colour));

        if (!state.directionalLight.enabled) {
            directionalLightColour.i = 0;
        }
        if (!state.pointLight.enabled) {
            pointLightColour.i = 0;
        }
        if (state.ambientLight.darkBackGround) {
            this.model.updateBg("#000000");
        }
        if (!state.ambientLight.darkBackGround) {
            this.model.updateBg('#FFFFFF');
        }
        this.model.updateLight(0, state.ambientLight.ambientLightColour);
        this.model.updateLight(1, directionalLightColour);
        this.model.updateLight(2, pointLightColour);
        this.model.updateLightPosition(1, state.directionalLight.position);
        this.model.updateLightPosition(2, state.pointLight.position);
        this.model.toggleLightHelper(1, state.directionalLight.helper);
        this.model.toggleLightHelper(2, state.pointLight.helper);
        if (!vid) {
            this.model.setCamera(state.camera.type, false);
            this.model.updateCameraPosition(state.camera.position);
        }
        this.model.updateLookAt(state.camera.lookAt);
        this.model.updateCameraZoom(state.camera.zoom);
    }

    setDefaultState(init, vid) {
        View.state = {};
        View.state.reference = this.ReferenceDefaultState;
        View.state.ambientLight = this.AmbientLightDefaultState;
        View.state.pointLight = this.PointLightDefaultState;
        View.state.directionalLight = this.DirectionalLightDefaultState;
        View.state.camera = this.CameraDefaultState;
        View.state.slicing = this.SlicingDefaultState;
        View.state.model = this.ModelDefaultState;
        View.state.model.configurations = [];
        View.state.model.sets = [];

        for (let i in this.model.sets) {
            let set = JSON.parse(JSON.stringify(this.ConfigurationDefaultState));
            set.title = this.model.sets[i].name;
            View.state.model.sets.push(set.title);
            View.state.model.configurations.push(set);
        }

        this.loadState(View.state, vid);

        if (!init) {
            this.loadModel(View.state);
        }
    }

    xor(a, b) {
        return (a && !b) || (!a && b);
    }

}

export default View;