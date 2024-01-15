let UI = {};

UI.init = ()=>{
    ATON.FE.uiAddButtonHome("idBottomToolbar");

	ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");

    ATON.FE.uiAddButton("idTopToolbar", "assets/i-records.png", UI.popupRecords );

	ATON.FE.uiAddButtonNav("idTopToolbar");
    ATON.FE.uiAddButtonVR("idTopToolbar");
    ATON.FE.uiAddButtonQR("idTopToolbar");


	$("#tSlider").on("input change",()=>{
		let t = parseFloat( $("#tSlider").val() );

		APP.setTime(t);

		t = t.toFixed(2);

		$("#tValue").html(t);

		let R = APP.getActiveRecord();
		if (!APP._bPano) ATON.Nav.requestPOVbyNode( R.getCurrentMark() );

		ATON.Photon.fireEvent("MKH_Time", t);
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
	htmlcontent += "<div id='rComputeFoc' class='atonBTN atonBTN-red atonBTN-horizontal'><img src='"+ATON.FE.PATH_RES_ICONS+"lp.png'>Compute Focal Points</div>";

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

		let R = new APP.Record(rid);
		R.loadViaAPI(()=>{
			console.log(R._tRangeMin+","+R._tRangeMax);

			$("#tSlider").attr("min", R._tRangeMin);
			$("#tSlider").attr("max", R._tRangeMax);

		});

		APP._records[rid] = R;
		APP._currRID = rid;
        
        ATON.FE.popupClose();
    });

	$("#rComputeFoc").click(()=>{
		APP.Processor.computeFocalPointsForLoadedRecords();
		ATON.FE.popupClose();
	});
};

export default UI;