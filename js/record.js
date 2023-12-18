
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node = undefined;
}

generateFromCSVdata(data){
    let N = ATON.createUINode(this.rid);

    let rows = data.split("\n");
    let num = rows.length;
    let values;

    //console.log(rows)

    for (let m=1; m<num; m++){
        let M = rows[m];

        values = M.split(",");

        let px = parseFloat(values[2]);
        let py = parseFloat(values[3]);
        let pz = parseFloat(values[4]);

        console.log(px,py,pz);

        let mark = new THREE.Sprite(APP.matSpriteMark);
        mark.position.set(px,py,pz);
        mark.scale.set(APP.MARK_SCALE,APP.MARK_SCALE,APP.MARK_SCALE);

        N.add(mark);
    }

    N.attachTo(APP.gRecords);

    return this;
}

loadViaAPI(){
    let self = this;
    let sid = ATON.SceneHub.currID;
    sid = sid.replace("/","-");

    $.get(APP.MKHET_API+"r/"+sid+"/"+self.rid, (data)=>{
        self.generateFromCSVdata(data);
    });

    return self;
}

loadFromCSVurl(url){
    let self = this;

    $.get(url, (data)=>{
        self.generateFromCSVdata(data);
    });

    return self;
}

}

export default Record;