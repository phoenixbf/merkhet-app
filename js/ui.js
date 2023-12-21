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
		if (!APP._record) return;

		let t = parseFloat( $("#tSlider").val() );

		APP.setTime(t);

		t = t.toFixed(2);

		$("#tValue").html(t);

		ATON.Photon.fireEvent("MKH_Time", t);
	});

	$("#tRad").on("input change", ()=>{
        if (!APP._record) return;
        
		let r = parseFloat( $("#tRad").val() );

		APP._record._filterTRad = r;
		APP._record.filter();
	});
};

UI.popupRecords = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Records</div>";
    htmlcontent += "<div class='atonPopupDescriptionContainer' style='text-align:center'>Select records to load</div><br>";
    
    htmlcontent += "<input id='rID' type='text' size='40' list='idRList' ></input>";
    htmlcontent += "<datalist id='idRList'></datalist><br>";

	htmlcontent += "<div id='rLoad' class='atonBTN atonBTN-green atonBTN-text'><img src='"+ATON.FE.PATH_RES_ICONS+"db.png'>LOAD</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $.get(APP.MKHET_API+"r/"+ APP.getSceneMerkhetID() +"/@", (data)=>{
        for (let d in data) $("#idRList").append("<option>"+data[d]+"</option>");
    });

    $("#rLoad").click(()=>{
        let rid = $("#rID").val();

		let R = new APP.Record(rid);
		R.loadViaAPI(()=>{
			console.log(R._tRangeMin+","+R._tRangeMax);

			$("#tSlider").attr("min", R._tRangeMin);
			$("#tSlider").attr("max", R._tRangeMax);
		});

		APP._record = R;
        
        ATON.FE.popupClose();
    });
};

export default UI;