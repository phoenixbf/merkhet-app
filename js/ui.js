let UI = {};

UI.init = ()=>{
    UI._elMainToolbar   = ATON.UI.get("sideToolbar");
    UI._elBottomToolbar = ATON.UI.get("bottomToolbar");
    UI._elUserToolbar   = ATON.UI.get("userToolbar");
	UI._elBottomPlate   = ATON.UI.get("bottomPlate");
	UI._elTimeline      = ATON.UI.get("timeline");

	UI.setupSpatial();

    // Dedicated side panel
    UI._elSidePanel = ATON.UI.createElementFromHTMLString(`
        <div class="offcanvas offcanvas-start aton-std-bg aton-sidepanel merkhet-side-panel" tabindex="-1">
        </div>
    `);
    UI._sidepanel = new bootstrap.Offcanvas(UI._elSidePanel);
    document.body.append(UI._elSidePanel);

	UI.buildToolbar();
};

UI.toggleBottomPlate = (b)=>{
	ATON.UI.toggleElement(UI._elBottomPlate, b);
};

UI.updateInfoElementFromRecord = (el, R,t)=>{
	if (!t) t = R._tRangeMin;
	if (!R) return;

/* 	let rv = ATON.Utils.removeFileExtension(R.rid).split("_");
	let date = rv[0];
	let rid  = rv[1]; */

	let rid = ATON.Utils.removeFileExtension(R.rid);

	//| <b>Date</b>: ${date}

	el.innerHTML = `
		<div class='merkhet-timeline-record' style='background-color:${R.getColor(0.5)}'><b>${rid}</b></div>
		<div style='white-space: nowrap; display:inline-block'><b>Time</b>: ${t.toFixed(2)} | <b>Duration</b>: ${APP.getMinutesString(R._tRangeD)}</div>
	`;

	//el.style.backgroundColor = R.getColor(0.2);
};

UI.buildTimelineForActiveRecord = ()=>{
	UI._elTimeline.innerHTML = "";

	let elInfo = ATON.UI.createContainer({classes: "merkhet-timeline-info"});

	let R = APP.getActiveRecord();
	if (!R) ATON.UI.hideElement(UI._elTimeline);

	if (!R._tRangeD) return;

	let range = [R._tRangeMin, R._tRangeMax];
	let step  = R._tRangeD * 0.001;

	let elSlider = ATON.UI.createSlider({
		range: range,
		step: step,
		//label: "Time",
		value: R._tRangeMin,
		classes: "merkhet-timeline-slider",
		oninput: (t)=>{
			t = parseFloat(t);
			APP.setTime(t);

			if (APP._bViewLock){
				let M = R.getCurrentMark();
				ATON.Nav.requestPOV( R.getPOVforMark(M), 0.1 );
			}

			UI.updateInfoElementFromRecord(elInfo,R,t);
			
			ATON.Photon.fire("MKH_Time", t);
		}
	});

	UI.updateInfoElementFromRecord(elInfo,R);

	UI._elTimeline.append( elInfo );
	UI._elTimeline.append( elSlider );
	//elInfo.append( ATON.UI.createElementFromHTMLString("<div class='merkhet-timeline-progress'></div>"))
};

UI.buildToolbar = ()=>{
    UI._elBottomToolbar.append(
		ATON.UI.createButtonFullscreen(),
        ATON.UI.createButtonHome(),
		UI.createViewLockButton()
    );

	UI._elUserToolbar.append( UI.createUserButton() );

	UI._elMainToolbar.append(
		ATON.UI.createButton({
        	icon: "assets/i-merkhet.png",
        	onpress: UI.modalMerkhet
    	}),

		UI.createCollaborateButton(),

		ATON.UI.createButton({
        	icon: "bi-activity",
        	onpress: UI.panelRecords
    	}),

		ATON.UI.createButton({
        	icon: "bi-bar-chart-fill",
        	onpress: UI.panelAggregates
    	}),

		ATON.UI.createButton({
        	icon: "bi-cpu",
        	onpress: UI.panelCompute
    	}),

		ATON.UI.createButtonVR(),
		ATON.UI.createButtonAR()
	);
};

UI.createUserButton = ()=>{
    UI._elUserBTN = ATON.UI.createButton({
        icon: "user",
        onpress: UI.modalUser
    });

    ATON.checkAuth((u)=>{
        UI._elUserBTN.classList.add("aton-btn-highlight");
    });

    return UI._elUserBTN;
};

UI.createCollaborateButton = ()=>{
	UI._elCollabBTN = ATON.UI.createButton({
		icon: "vrc",
		tooltip: "Collaborate with remote analysts",
		onpress: ()=>{
			if (ATON.Photon.isConnected()){
				ATON.Photon.disconnect();
				UI._elCollabBTN.classList.remove("aton-btn-highlight");
			}
			else {
				if (!APP._cses) return;

				ATON.Photon.connect(APP._cses);
				UI._elCollabBTN.classList.add("aton-btn-highlight");
			}
		}
	});

	return UI._elCollabBTN;
};

UI.createViewLockButton = ()=>{
	let el = ATON.UI.createButton({
		icon: "bi-lock-fill",
		onpress: ()=>{
			if (!APP._bViewLock){
				el.classList.add("aton-btn-highlight");
				
				let R = APP.getActiveRecord(); 
				if (R) R.meshPath.visible = false;

				APP._bViewLock = true;
			}
			else {
				el.classList.remove("aton-btn-highlight");

				let R = APP.getActiveRecord(); 
				if (R) R.meshPath.visible = true;

				APP._bViewLock = false;
			}
		}
	});

	return el;
};

/*
    Modals
=====================================*/

UI.modalMerkhet = ()=>{
	UI.closeToolPanel();

	ATON.UI.showModal({
		header: "Merkhet",
		body: ATON.UI.createContainer({
			items:[
				ATON.UI.createElementFromHTMLString(`
					<div style='text-align:center'>
						<img src='${APP.DIR_ASSETS}merkhet.png' class='merkhet-logo'><br><br>
						<p style='text-align:justify'>
						Merkhet is an open-source Collaborative Immersive Analytics WebXR toolkit, developed under <a href='https://www.h2iosc.cnr.it/' target='_blank'>H2IOSC project</a> as part of task 7.7 (Immersive Analytics). It is used in conjunction with <a href='https://github.com/phoenixbf/merkhet-plugin' target='_blank'>Merkhet plugin</a> for ATON, specifically dedicated to capture and track remote users' interactive sesssions.
						</p>
					</div>
				`)
			]
		})
	})
};


UI.modalUser = ()=>{

    ATON.checkAuth(
        // Logged
        (u)=>{
            let elBody = ATON.UI.createContainer({ classes: "d-grid gap-2" });
            elBody.append(
                ATON.UI.createButton({
                    text: "Logout",
                    icon: "exit",
                    classes: "btn-secondary",
                    onpress: ()=>{
                        ATON.REQ.logout();
                        ATON.UI.hideModal();

                        if (UI._elUserBTN) UI._elUserBTN.classList.remove("aton-btn-highlight");
                    }
                })
            );

			UI.closeToolPanel();

            ATON.UI.showModal({
                header: u.username,
                body: elBody
            })
        },
        // Not logged
        ()=>{
			UI.closeToolPanel();

            ATON.UI.showModal({
                header: "Analyst",
                body: ATON.UI.createLoginForm({
                    onSuccess: (r)=>{
                        ATON.UI.hideModal();
                        if (UI._elUserBTN) UI._elUserBTN.classList.add("aton-btn-highlight");
                    },
                    onFail: ()=>{
                        // TODO:
                    }
                })
            })
        }
    );
};


/*
    Side tools
=====================================*/
UI.openToolPanel = (options)=>{
    if (!options) options = {};

    UI._elSidePanel.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("offcanvas-header");

        el.innerHTML = "<h4 class='offcanvas-title'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='offcanvas' aria-label='Close'></button>";

        if (options.headelement) el.prepend(options.headelement);

        UI._elSidePanel.append(el);
    }

    if (options.body){
        let el = document.createElement('div');
        el.classList.add("offcanvas-body");

        el.append(options.body);

        UI._elSidePanel.append(el);
    }

    UI._sidepanel.show();
};

UI.closeToolPanel = ()=>{
    UI._sidepanel.hide();
    //UI._bSidePanel = false;
};

UI.createRecordItem = (rid)=>{
	const R = APP._records[rid];

	let rname = ATON.Utils.removeFileExtension(rid);

	let el = ATON.UI.createContainer({classes: "merkhet-record"});
/* 
	el.onclick = ()=>{
		APP.setActiveRecord(rid);
	};
 */
	let strcol = R.getColor(0.3);
	el.style.backgroundColor = strcol;

	const elActionsC = ATON.UI.createContainer({style: "display:inline-block; margin-right:0px"});

	elActionsC.append( ATON.UI.createButton({
		icon: "bi-crosshair",
		size: "small",
		onpress: ()=>{
			APP.setActiveRecord(rid);
			ATON.Photon.fire("MKH_ActiveRecord", rid);
		}
	}));

	el.append( elActionsC );
	el.append( rname );

	//if (rid === APP._currRID) el.classList.add("merkhet-record-active");
/*
	el.append( ATON.UI.createButton({
		text: rid,
		onpress: ()=>{
		}
	}));
*/
	return el;
};

UI.panelRecords = ()=>{
	let elListRecords = ATON.UI.createContainer({style: "margin-top: 8px"});
	for (let r in APP._records) elListRecords.append( UI.createRecordItem(r) );

	let elAddRecord = ATON.UI.createContainer();

	ATON.REQ.get(APP.CAPTUREHUB_API+"sessions/"+ APP.getSceneMerkhetID() +"/*", (data)=>{
		let rlist = [];

        for (let d in data){
			let rid = data[d];

			// Avoid duplicates
			if (!APP._records[rid]) rlist.push(rid); //$("#idRList").append("<option>"+data[d]+"</option>");
		}

		const numRecords = data.length;

		let elIF = ATON.UI.createInputText({
			list: rlist,
			label: "Records",
			placeholder: (numRecords > 0)? numRecords+" records available" : "No records available!"
		});

		let elInput = ATON.UI.getComponent(elIF, "input");
		let dl = ATON.UI.getComponent(elIF, "datalist");

		elIF.append( ATON.UI.createButton({
			icon: "add",
			classes: "btn-default",
			onpress: ()=>{
				let rid = elInput.value;
				if (!rid) return;
				if (rid.length < 2) return;

				APP.loadRecord( rid, (r)=>{
					//APP.setActiveRecord(rid);
					elListRecords.append( UI.createRecordItem(rid) );

					ATON.Photon.fire("MKH_ActiveRecord", rid);
					
					// TODO: remove entry from datalist
				});

				elInput.value = "";
			}
		}));

		elAddRecord.append( elIF );

    });

	UI.openToolPanel({
        header: "Records",
        body: ATON.UI.createContainer({
            items:[
				ATON.UI.createElementFromHTMLString("<p class='merkhet-text-block'>Please pick one or more records from the capture hub for analysis and visual inspection</p>"),
				elAddRecord,
                elListRecords
            ]
        })
    });
};

UI.panelAggregates = ()=>{
	let elAddAggregate = ATON.UI.createContainer();

	ATON.REQ.get(APP.CAPTUREHUB_API+"sessions/"+ APP.getSceneMerkhetID() +"/*", (data)=>{
		let rlist = [];

        for (let d in data){
			let rid = data[d];

			// Avoid duplicates
			if (rid.endsWith(".json")) rlist.push(rid);
		}

		let numRecords = rlist.length;

		let elIF = ATON.UI.createInputText({
			list: rlist,
			label: "Aggregates",
			placeholder: (numRecords > 0)? numRecords+" aggregates available" : "No aggregates available!"
		});

		let elInput = ATON.UI.getComponent(elIF, "input");

		elIF.append( ATON.UI.createButton({
			icon: "add",
			classes: "btn-default",
			onpress: ()=>{
				let rid = elInput.value;
				if (!rid) return;
				if (rid.length < 2) return;

				let agData = APP.CAPTUREHUB_API+"aggregates/"+ APP._mksid +"/"+ATON.Utils.removeFileExtension(rid);

				APP.loadDataAggregate(agData, ()=>{

					//elListRecords.append( UI.createRecordItem(rid) );
					
					// TODO: remove entry from datalist
				});

				ATON.Photon.fire("MKH_Aggregate", agData);

				elInput.value = "";
			}
		}));

		elAddAggregate.append( elIF );
	});

	UI.openToolPanel({
        header: "Aggregates",
        body: ATON.UI.createContainer({
            items:[
				ATON.UI.createElementFromHTMLString("<p class='merkhet-text-block'>Please pick one or more data aggregates generated by Procezo service for visual inspection</p>"),
				elAddAggregate,

				ATON.UI.createContainer({
					items:[
						ATON.UI.createButton({
							icon: "trash",
							text: "Clear Aggregates",
							classes: "btn-default",
							onpress: ()=>{
								APP.clearAggregates();
							}
						})
					],
					classes:"d-grid gap-2"
				})
            ]
        })
    });
};

UI.panelCompute = ()=>{

	UI.openToolPanel({
        header: "Compute",
        body: ATON.UI.createContainer({
				classes:"d-grid gap-2",
				items:[
					ATON.UI.createElementFromHTMLString("<p class='merkhet-text-block'>Locally compute fixations via voxel-based volume for all records loaded</p>"),

					ATON.UI.createButton({
						icon: "bi-cpu",
						text: "Focal Fixations",
						classes: "btn-default",
						onpress: ()=>{
							APP.Processor.computeFocalFixationsForLoadedRecords();
							//UI.closeToolPanel();
						}
					}),

					ATON.UI.createButton({
						icon: "bi-cpu",
						text: "Positional Fixations",
						classes: "btn-default",
						onpress: ()=>{
							APP.Processor.computePositionalFixationsForLoadedRecords();
							//UI.closeToolPanel();
						}
					}),
				],
			})
    });
};

UI.openAnnotateMark = (M)=>{
	if (!M) return;

	let R = APP.getActiveRecord();
	let kd = M.userData;
	if (!kd) return;

	let m = R.getMarkIndex(M);

	let elTextArea = ATON.UI.createElementFromHTMLString("<textarea spellcheck='false' rows='4' cols='50'></textarea>");

	let elBody = ATON.UI.createContainer({
		classes:"d-grid gap-2",
		items:[
			ATON.UI.createElementFromHTMLString(`
				<p class='merkhet-text-block'>
					<b>Timestamp</b>: ${kd.time} (${APP.getMinutesString(kd.time)})
				</p>
			`),

			ATON.UI.createButton({
				icon: "pov",
				text: "View",
				classes: "btn-default",
				onpress: ()=>{
					let pov = R.getPOVforMark(M);
					ATON.Nav.requestPOV(pov, 0.3);
				}
			}),

			ATON.UI.createElementFromHTMLString(`
				<p class='merkhet-text-block'><br>
				You can use this box below to freely annotate your thoughts for this specific time mark of the record "${R.rid}"
				</p>
			`),

			elTextArea,
			ATON.UI.createButton({
				icon: "note",
				text: "Annotate",
				classes: "btn-default",
				onpress: ()=>{
					let content = elTextArea.value.trim();
					let audio   = undefined;

					if (content.length > 1){
						R.saveBookmark(m, content, audio, ()=>{
							ATON.Photon.fire("MKH_Annotation", {mark: m, rid: R.rid});
						});
						UI.closeToolPanel();
					}
				}
			})
		]
	});

	// Retrieve previous annotation if any
	R.getSemStorage((s)=>{
		if (!s.bookmarks) return;

		let B = s.bookmarks[m];
		if (!B) return;
		if (!B.content) return;

		elTextArea.value = B.content;

		elBody.append(ATON.UI.createButton({
			icon: "trash",
			text: "Delete",
			classes: "btn-default",
			onpress: ()=>{
				R.removeBookmark(m, ()=>{
					//
				});

				UI.closeToolPanel();
			}
		}));
	});
	
	UI.openToolPanel({
		header: "Mark #"+m,
		body: elBody
	});
};



// Spatial UI
//==================================================
UI.setupSpatial = ()=>{
	let buttons = [];

	let btnTalk = new ATON.SUI.Button("sui_talk");

    btnTalk.setIcon(ATON.UI.PATH_RES_ICONS+"talk.png")
        //.setSwitchColor(ATON.MatHub.colors.orange)
        .onSelect = ()=>{
            if (ATON.MediaFlow.isAudioRecording()){
                ATON.MediaFlow.stopAudioStreaming();
                btnTalk.switch(false);
            }
            else {
                ATON.MediaFlow.startAudioStreaming();
                btnTalk.switch(true);
            }
        };

	buttons.push( btnTalk );

    UI.sToolbar = ATON.SUI.createToolbar( buttons );

    // wrist sui
    let pi2 = (Math.PI * 0.5);
    UI.sToolbar.setPosition(-0.1,0.05,0.1).setRotation(-pi2,0.0,pi2).setScale(0.5);

    UI.sToolbar.attachToRoot();
    UI.sToolbar.hide();
};

export default UI;