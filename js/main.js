/*
	Main js entry for Merkhet App

===============================================*/
import Record from "./record.js";


let APP = ATON.App.realize();
window.APP = APP;

APP.MKHET_API  = "/mkhet/";
APP.DIR_ASSETS = APP.basePath + "assets/";
APP.MARK_SCALE = 0.5;

// Classes/Components
APP.Record = Record;


// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
	APP._record = undefined;
	
	APP._vZero = new THREE.Vector3(0,0,0);

    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    ATON.FE.uiAddButtonHome("idBottomToolbar");

	ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
    ATON.FE.uiAddButtonQR("idTopToolbar");
    ATON.FE.uiAddButtonVR("idTopToolbar");

	let sid = APP.params.get("s");

	if (!sid) return;

	console.log(sid)

	ATON.FE.loadSceneID(sid);

	APP.gRecords = ATON.createUINode("records");
	APP.gRecords.attachToRoot();
	
	ATON.SUI.showSelector(false);

	APP.setupEvents();
	APP.setupAssets();
};

APP.setupAssets = ()=>{
	APP.matSpriteMark = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" ),
        
		transparent: true,
        //opacity: 0.5,
        
		color: ATON.MatHub.colors.green,
        depthWrite: false, 
        //depthTest: false
        
		//blending: THREE.AdditiveBlending
    });

	APP.mark = new THREE.Sprite(APP.matSpriteMark);

	APP.matDirection = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.green,
        //linewidth: 5,
        transparent: true,
        depthWrite: false,
        opacity: 0.5, 
        //depthTest: false
        //flatShading: true
    });

	APP.matFOV = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "fov.png" ),
        color: ATON.MatHub.colors.green,

		transparent: true,
        depthWrite: false,
        opacity: 0.1, 
        //depthTest: false
        //flatShading: true
    });
};

APP.setupEvents = ()=>{
	ATON.on("SceneJSONLoaded", sid =>{
		let rid = APP.params.get("r");
		if (!rid) return;

		let R = new APP.Record(rid);
		R.loadViaAPI(()=>{
			console.log(R._tRangeMin+","+R._tRangeMax);

			$("#tSlider").attr("min", R._tRangeMin);
			$("#tSlider").attr("max", R._tRangeMax);
		});

		APP._record = R;
	});


	$("#tSlider").on("input change",()=>{
		if (!APP._record) return;

		let t = parseFloat( $("#tSlider").val() );

		APP._record._filterTime = t;
		APP._record.filter();

		$("#tValue").html(t.toFixed(2));
	});
};

/* APP.update() if you plan to use an update routine (executed continuously)
APP.update = ()=>{

};
*/


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
