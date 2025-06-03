
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node  = undefined;
    this.marks = undefined;
    this.meshPath = undefined;

    this._filterTime = 0.0;
    this._filterTRad = 0.2;

    this._tRangeMin = undefined;
    this._tRangeMax = undefined;
    this._tRangeD   = 0.0;

    let numCurrentRecs = Object.keys(APP._records).length;
    this._color  = APP.recColors[ numCurrentRecs % APP.recColors.length ];
    this._matSem = APP.recSemMats[ numCurrentRecs % APP.recSemMats.length ];

    this._currMarkInd = 0;
    //this._marks = [];
    //this.setupCursor();

    // Bookmarks / Annotations
    this._gBookmarks = undefined;
    this._semAnnNodes  = {};
    this._semStorageID = rid;
}

switch(b){
    if (!b){
        if (this.node) this.node.hide();
        if (this._gBookmarks) this._gBookmarks.hide();
        for (let a in this._semAnnNodes) this._semAnnNodes[a].hide();
        return;
    }

    if (this.node) this.node.show();
    if (this._gBookmarks) this._gBookmarks.show();
    for (let a in this._semAnnNodes) this._semAnnNodes[a].show();
}

setSemStorageID(ss){
    this._semStorageID = ss;
};

getSemStorage( f ){
    APP.getStorage( this._semStorageID ).then( f );
}

getBookmarksList(){
    return this._semAnnNodes;
}

// Unused for now
/*
setupCursor(){
    let matMark = APP.matSpriteMark.clone();
    matMark.color = this._color;

    let matLine = APP.matPath.clone();
    matLine.color = this._color;

    this._cursor = ATON.createUINode("cur-"+this.rid);

    // 3D Representation
    let mark = new THREE.Sprite(matMark);
    //mark.raycast = APP.VOID_CAST;
    this._cursor.add(mark);

    if (APP._bPano){
        mark.scale.setScalar(APP.MARK_SCALE * 50.0);
    }
    else {
        mark.scale.setScalar(APP.MARK_SCALE);
        //this._cursor.position.set(px,py,pz);

        let conesize = 5.0;
        let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
        gfov.rotateX(Math.PI*0.5);
        gfov.translate(0,0,-0.5*conesize);

        let mfov = new THREE.Mesh( gfov, APP.matFOV );
        mfov.lookAt(-dx, -dy, -dz);

        this._cursor.add(mfov);
    }

    this._cursor.enablePicking();

    this._cursor.setOnHover(()=>{
        this._cursor.scale.setScalar(1.5);
        APP._hoverMark = K;

    });
    this._cursor.setOnLeave(()=>{
        this._cursor.scale.setScalar(1);
        APP._hoverMark = undefined;
    });
}
*/

clear(){
    this.node.removeChildren();
    if (this._gBookmarks) this._gBookmarks.removeChildren();
    for (let a in this._semAnnNodes) this._semAnnNodes[a] = null;
}

getMark(i){
    if (!this.marks) return undefined;

    let marks = this.marks.children;
    return marks[i];
}

getCurrentMark(){
    return this.getMark(this._currMarkInd);
}

getMarkIndex(M){
    if (M.userData.i === undefined) return -1;
    return M.userData.i;
/*
    let num = this.marks.children.length;
    for (let i=0; i<num; i++){
        if (this.marks.children[i]===M) return i;
    }
    return -1;
*/
}

generateFromCSVdata(data){
    this.node = ATON.createUINode(this.rid);
    let self = this;

    this.marks = ATON.createUINode();
    this.marks.attachTo(this.node);

    this._gBookmarks = ATON.createUINode();
    this._gBookmarks.attachTo(this.node);

    let rows = data.split("\n");
    let num = rows.length;

    if (num < 3){
        console.log("Not sufficient data for this record")
        return this;
    }

    let values;

    let path = [];

    //let matMark = APP.matSpriteCursor.clone(); //APP.matSpriteMark.clone();
    ///matMark.color = this._color;

    let matLine = APP.matPath.clone();
    matLine.color = this._color;

    let matfov = APP.matFOV.clone();
    matfov.color = this._color;

    // Header
    let H = rows[0];
    H = H.split(",");

    let C_NAV = H.indexOf("nav");
    let C_POS = H.indexOf("posx");
    let C_DIR = H.indexOf("dirx");
    let C_FOV = H.indexOf("fov");
    let C_SEL = H.indexOf("selx");
    let C_LHPOS = H.indexOf("lh_pos");
    let C_RHPOS = H.indexOf("rh_pos");


    for (let m=1; m<num; m++){
        let M = rows[m];

        values = M.split(",");
        
        let t = parseFloat(values[0]);

        if (!isNaN(t)){
            if (this._tRangeMin===undefined) this._tRangeMin = t;

            // Nav mode
            let nav = undefined;
            if (C_NAV>=0) nav = values[C_NAV];

            // Position
            let px = undefined;
            let py = undefined;
            let pz = undefined;
            if (C_POS>=0){
                px = parseFloat(values[C_POS]);
                py = parseFloat(values[C_POS+1]);
                pz = parseFloat(values[C_POS+2]);
            }

            // View direction
            let dx = undefined;
            let dy = undefined;
            let dz = undefined;
            if (C_DIR>=0){
                dx = parseFloat(values[C_DIR]);
                dy = parseFloat(values[C_DIR+1]);
                dz = parseFloat(values[C_DIR+2]);
            }

            let fov = undefined;
            if (C_FOV>=0) fov = parseFloat(values[C_FOV]);

            let K = ATON.createUINode(this.rid+"-m"+m);

            
/*
            let MD = {
                time: t,
                nav: nav,
                pos: new THREE.Vector3(px,py,pz),
                dir: new THREE.Vector3(dx,dy,dz),
                fov: fov
            };
            this._marks.push(MD);

            path.push(MD.pos);
*/

            // UserData
            K.userData.i    = path.length;
            K.userData.time = t;
            if (nav!==undefined) K.userData.nav  = nav;
            if (px!==undefined)  K.userData.pos  = [px,py,pz];
            if (dx!==undefined)  K.userData.dir  = [dx,dy,dz];
            if (fov!==undefined) K.userData.fov  = fov;

            path.push(K.position);

            // 3D Representation
            let mark = new THREE.Sprite( APP.matSpriteCursor /*matMark*/);
            mark.renderOrder = 100;
            //mark.raycast = APP.VOID_CAST;
            K.add(mark);

            if (APP._bPano){
                K.position.set(
                    dx * APP._panoScale,
                    dy * APP._panoScale,
                    dz * APP._panoScale
                );

                mark.scale.setScalar(APP.MARK_SCALE * 50.0);
            }
            else {
                mark.scale.setScalar(APP.MARK_SCALE);
                K.position.set(px,py,pz);

                // Trigger
/*
                let gs = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
                gs.scale.setScalar(0.3);
                K.add(gs);
*/


                let conesize = 5.0;
                let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
                gfov.rotateX(Math.PI*0.5);
                gfov.translate(0,0,-0.5*conesize);
    
                let mfov = new THREE.Mesh( gfov, matfov );
                mfov.lookAt(-dx, -dy, -dz);
                mfov.raycast = APP.VOID_CAST;

                K.add(mfov);


                let gDir = new THREE.BufferGeometry().setFromPoints([APP._vZero, new THREE.Vector3(dx, dy, dz)]);
                let dLine = new THREE.Line( gDir, APP.matDirection);
                dLine.raycast = APP.VOID_CAST;
                K.add( dLine );
            }


            K.enablePicking();
            K.setOnHover(()=>{
                K.scale.setScalar(1.5);
                APP._hoverMark = K;

            });
            K.setOnLeave(()=>{
                K.scale.setScalar(1);
                APP._hoverMark = undefined;
            });

            this.marks.add(K);

            K.hide();

            this._tRangeMax = t;
        }
    }

    //if (num<2) return this;

    this.node.attachTo(APP.gRecords);

    // Path
    let gPath = new THREE.BufferGeometry().setFromPoints( path );
    ///let gPath = new THREE.LineGeometry().setFromPoints( path );
    let mPath = new THREE.Line( gPath, matLine );
    mPath.raycast = APP.VOID_CAST;
    
    this.node.add(mPath);
/*
    let nsegs = path.length * 4;
    let pathrad = 0.01; //0.03;
    if (APP._bPano) pathrad = 0.3;

    let gPath = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), nsegs, pathrad, 6, false );
    this.meshPath = new THREE.Mesh( gPath, matLine );
    this.meshPath.raycast = APP.VOID_CAST;

    this.node.add(this.meshPath);
*/
    this._tRangeD = (this._tRangeMax - this._tRangeMin);

    return this;
}

loadViaAPI( onComplete ){
    let self = this;
    let sid = APP.getSceneMerkhetID(ATON.SceneHub.currID);

    let rrid = ATON.Utils.removeFileExtension(self.rid);

    $.get(APP.MKHET_API+"sessions/"+sid+"/"+rrid, (data)=>{
        if (data) self.generateFromCSVdata(data);
        
        if (onComplete) onComplete();
    });

    return self;
}

loadFromCSVurl(url, onComplete){
    let self = this;

    $.get(url, (data)=>{
        self.generateFromCSVdata(data);
        if (onComplete) onComplete();
    });

    return self;
}

filter(){
    let marks = this.marks.children;
    let num = marks.length;
    if (num < 1) return;

    if (this._tRangeMax===undefined || this._tRangeMin===undefined) return;

    let t = (this._filterTime - this._tRangeMin) / this._tRangeD;

    this._currMarkInd = parseInt(t*num);

    for (let r=0; r<num; r++){
        let M = marks[r];
        let mt = M.userData.time;

        if (r === this._currMarkInd){
            M.show();
        }
        else M.hide();
    }
}

getPOVforMark = (M)=>{
    let kd = M.userData;
    if (!kd) return undefined;

    let T = new THREE.Vector3();
    T.set(
        M.position.x + kd.dir[0],
        M.position.y + kd.dir[1],
        M.position.z + kd.dir[2], 
    );
    
    let pov = new ATON.POV();
    if (!APP._bPano) pov.setPosition(M.position);
    pov.setTarget(T);

    return pov;
};

getOrCreateBookmark(i){
    let B = this._semAnnNodes[i];
    if (B) return B;

    let M = this.getMark(i);

    let r = 0.2;
    if (APP._bPano) r *= 20.0;

    B = ATON.SemFactory.createSphere(undefined, M.position, r);
    B.attachTo(this._gBookmarks);

    B.setDefaultAndHighlightMaterials(this._matSem, APP.recSemMatHL);
    B.restoreDefaultMaterial();

    B.userData.mark = M;

    this._semAnnNodes[i] = B; // Register

    return B;
}

saveBookmark(i, content, audio){
    if (!content) return;
    if (content.length < 1) return; 

    let B = this.getOrCreateBookmark(i);

    let O = {};
    O.bookmarks = {};
    O.bookmarks[i] = {};
    O.bookmarks[i].content = content;

    APP.addToStorage( this._semStorageID, O ); //.then(...)
}

}

export default Record;