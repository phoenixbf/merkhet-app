/*
	Main js entry for Merkhet App

===============================================*/
import Record from "./record.js";


let APP = ATON.App.realize();
window.APP = APP;

APP.MKHET_API  = "/mkhet/";
APP.DIR_ASSETS = APP.basePath + "assets/";
APP.MARK_SCALE = 0.2;

// Classes/Components
APP.Record = Record;


// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
	APP._record = undefined;

    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    ATON.FE.uiAddButtonHome("idBottomToolbar");
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
    ATON.FE.uiAddButtonQR("idTopToolbar");
    //ATON.FE.uiAddButtonVR("idTopToolbar");

	//ATON.FE.uiAddButtonInfo("idBottomRToolbar");

	let sid = APP.params.get("s");

	if (!sid) return;

	console.log(sid)

	ATON.FE.loadSceneID(sid);

	APP.gRecords = ATON.createUINode("records");
	APP.gRecords.attachToRoot();

	APP.setupEvents();
	APP.setupAssets();
};

APP.setupAssets = ()=>{
	APP.matSpriteMark = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.jpg" ),
        
		//transparent: true,
        //opacity: 0.5,
        
		color: ATON.MatHub.colors.green,
        depthWrite: false, 
        //depthTest: false
        blending: THREE.AdditiveBlending
    });

	APP.mark = new THREE.Sprite(APP.matSpriteMark);
};

APP.setupEvents = ()=>{
	ATON.on("SceneJSONLoaded", sid =>{
		let rid = APP.params.get("r");
		if (!rid) return;

		let R = new APP.Record(rid).loadViaAPI(()=>{
			//$("#tSlider").attr("max", );
		});

		APP._record = R;
	});


	$("#tSlider").on("input change",()=>{
		if (!APP._record) return;

		let t = parseFloat( $("#tSlider").val() );

		APP._record._filterTime = t;
		APP._record.filter();
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
