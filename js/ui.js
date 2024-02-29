let UI = {};

UI.init = ()=>{
    ATON.FE.uiAddButtonHome("idBottomToolbar");

	ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");

    ATON.FE.uiAddButton("idTopToolbar", "assets/i-records.png", UI.popupRecords );
	ATON.FE.uiAddButton("idTopToolbar", "assets/i-process.png", UI.popupProcess );

	ATON.FE.uiAddButtonNav("idTopToolbar");
    ATON.FE.uiAddButtonVR("idTopToolbar");
	ATON.FE.uiAddButtonAR("idTopToolbar");
    ATON.FE.uiAddButtonQR("idTopToolbar");


	$("#tSlider").on("input change",()=>{
		let t = parseFloat( $("#tSlider").val() );
		let bCamLock = $("#idCamLock").is(':checked');

		APP.setTime(t);

		t = t.toFixed(2);

		$("#tValue").html(t);

		let R = APP.getActiveRecord();

		if (bCamLock){
			let M = R.getCurrentMark();
			ATON.Nav.requestPOV( R.getPOVforMark(M), 0.1 );
		}
		else {
		}

		ATON.Photon.fireEvent("MKH_Time", t);
	});

	$("#idPathVis").on("input change", ()=>{
		let b = $("#idPathVis").is(':checked');

		let R = APP.getActiveRecord();
		if (!R) return;

		R.meshPath.visible = b;
	});

	$("#tRad").on("input change", ()=>{
		let r = parseFloat( $("#tRad").val() );

		APP._record._filterTRad = r;
		APP._record.filter();
	});
};

UI.popupRecords = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Records</div>";
	//htmlcontent += "<h2>Current Records</h2>";
	for (let r in APP._records) htmlcontent += "<div class='atonBTN atonBTN-horizontal'>"+r+"</div>";
	htmlcontent += "<br>";

    htmlcontent += "<div class='atonPopupDescriptionContainer' style='text-align:center'>Select records to load</div><br>";
    htmlcontent += "<input id='rID' type='text' size='40' list='idRList' ></input>";
    htmlcontent += "<datalist id='idRList'></datalist><br>";

	htmlcontent += "<div id='rLoad' class='atonBTN atonBTN-green atonBTN-horizontal'><img src='"+ATON.FE.PATH_RES_ICONS+"db.png'>LOAD</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $.get(APP.MKHET_API+"r/"+ APP.getSceneMerkhetID() +"/@", (data)=>{
        for (let d in data){
			let rid = data[d];

			// Avoid duplicates
			if (!APP._records[rid]) $("#idRList").append("<option>"+data[d]+"</option>");
		}
    });

    $("#rLoad").click(()=>{
        let rid = $("#rID").val();

		if (rid.endsWith(".json")){
			APP.loadProcessedData(APP.MKHET_API+"r/"+ APP._mksid +"/"+rid);
			ATON.FE.popupClose();
			return;
		}

		APP.loadRecord(rid);
        
        ATON.FE.popupClose();
    });
};


UI.popupProcess = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Compute</div>";

	htmlcontent += "Compute focal-fixations via voxel-based volume for all records loaded<br>"
	htmlcontent += "<div id='rComputeFoc' class='atonBTN atonBTN-red atonBTN-horizontal'><img src='"+ATON.FE.PATH_RES_ICONS+"lp.png'>Compute Focal Fixations</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

	$("#rComputeFoc").click(()=>{
		APP.Processor.computeFocalFixationsForLoadedRecords();
/*
		let vtex = APP.Processor._volumeFocalPoints.get3DTexture((v)=>{
			if (!v) return 0;

			return 255;
		})

		APP.uniforms.tVol.value = vtex;
*/
		ATON.FE.popupClose();
	});
};

UI.popupMark = (M)=>{
	if (!M) return;

	let R = APP.getActiveRecord();
	let kd = M.userData;
	if (!kd) return;

	let m = R.getMarkIndex(M);

    let htmlcontent = "<div class='atonPopupTitle'>Mark #"+m+" (Timestamp "+kd.time+")</div>";

	htmlcontent += "<div id='markPOV' class='atonBTN atonBTN-horizontal'><img src='"+ATON.FE.PATH_RES_ICONS+"pov.png'>View</div>";

	htmlcontent += "Annotation for this mark:<br>";
	htmlcontent += "<textarea id='idMarkAnn' rows='4' cols='50'></textarea>";
	htmlcontent += "<div id='btnMAnn' class='atonBTN atonBTN-green atonBTN-horizontal'><img src='"+ATON.FE.PATH_RES_ICONS+"note.png'>Save</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

	R.getSemStorage((s)=>{
		if (!s.bookmarks) return;

		let B = s.bookmarks[m];
		if (!B) return;
		if (!B.content) return;

		$("#idMarkAnn").val(B.content);
	});

	$("#markPOV").click(()=>{
		let pov = R.getPOVforMark(M);

		ATON.Nav.requestPOV(pov, 0.3);
		//ATON.FE.popupClose();
	});

	$("#btnMAnn").click(()=>{
		let content = $("#idMarkAnn").val();
		content.trim();

		if (content.length > 1){
			R.saveBookmark(m, content);
			ATON.FE.popupClose();
		}
	});
};

export default UI;