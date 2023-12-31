/*
	Main js entry for Merkhet App

===============================================*/
import Record from "./record.js";
import UI from "./ui.js";


let APP = ATON.App.realize();
window.APP = APP;

APP.MKHET_API  = "/mkhet/";
APP.DIR_ASSETS = APP.basePath + "assets/";
APP.MARK_SCALE = 0.5;

// Classes/Components
APP.Record = Record;
APP.UI     = UI;

APP.getSceneMerkhetID = (sid)=>{
	if (!sid) sid = ATON.SceneHub.currID;

	return sid.replace("/","-");
};

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
	APP._record = undefined;

	APP._vZero = new THREE.Vector3(0,0,0);

    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

	APP.UI.init();

	let sid = APP.params.get("s");

	if (!sid) return;

	console.log(sid)

	ATON.FE.loadSceneID(sid);

	APP.gRecords = ATON.createUINode("records");
	APP.gRecords.attachToRoot();
	
	APP.gProcessed = ATON.createUINode("processed");
	APP.gProcessed.attachToRoot();

	ATON.SUI.showSelector(false);

	APP.setupEvents();
	APP.setupAssets();

	let occupData = APP.params.get("o");
	if (occupData) APP.loadOccupancyData(APP.MKHET_API+"r/"+ APP.getSceneMerkhetID(sid) +"/"+occupData);
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

APP.setTime = (t)=>{
	APP._record._filterTime = t;
	APP._record.filter();
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

	// Collaborative
	ATON.Photon.on("MKH_Time", (t)=>{
		if (!APP._record) return;

		t = parseFloat(t);

		$("#tSlider").val(t);
		$("#tValue").html(t);

		APP.setTime(t);
	});
};

/* APP.update() if you plan to use an update routine (executed continuously)
APP.update = ()=>{

};
*/

APP.loadOccupancyData = (path)=>{
	$.getJSON( path, ( data )=>{
        console.log("Loaded occupancy data: "+path);

		let points = data.points;
		if (!points) return;

		let maxocc = points[0].occupancy;

		for (let p=0; p<50; p++){
			let P = points[p];
			let px = P.x;
			let py = P.y;
			let pz = P.z;
			let o  = P.occupancy;
			let scale = data.voxelsize * 8.0;

			let K = ATON.createUINode("o"+o);
			K.position.set(px,py,pz);
/*
			let mat = new THREE.MeshBasicMaterial({
				color: ATON.MatHub.colors.blue,
				transparent: true,
				depthWrite: false,
				opacity: o / maxocc
			});

			let mark = new THREE.Mesh( ATON.Utils.geomUnitCube, mat);
*/

			let mat = new THREE.SpriteMaterial({ 
				map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" ),
				
				transparent: true,
				opacity: o / maxocc,
				
				color: ATON.MatHub.colors.blue,
				depthWrite: false, 
				//depthTest: false
				
				blending: THREE.MultiplicativeBlending
			});

            let mark = new THREE.Sprite(mat);
        
			
			//let scale = 5.0; //(o * 5.0) / maxocc;
			mark.scale.set(scale,scale,scale);
            K.add(mark);

            K.enablePicking().setOnHover(()=>{
                console.log("occupancy:" + o);
            });

			APP.gProcessed.add(K);
		}
	});
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
