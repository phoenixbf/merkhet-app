let Tracer = {};

Tracer.init = ()=>{
    Tracer._rc = new THREE.Raycaster();
    Tracer._rc.layers.set(ATON.NTYPES.SCENE);
    Tracer._rc.firstHitOnly = true;

	Tracer._hitList = [];
	Tracer._hit = {};

	Tracer._offs = undefined;
	Tracer._maxD = undefined;
};

Tracer.setMaxDistance = (maxD)=>{
	Tracer._maxD = maxD;
};

Tracer.setOffset = (offs)=>{
	Tracer._offs = offs;
};

Tracer.trace = (location, direction, maxD)=>{

	Tracer._rc.set( location, direction );

    Tracer._hitList = [];
    Tracer._rc.intersectObjects( ATON._mainRoot.children, true, Tracer._hitList );

    const hitsnum = Tracer._hitList.length;
    if (hitsnum <= 0){
        return undefined;
    }

    const h = Tracer._hitList[0];

	if (Tracer._maxD && h.distance > Tracer._maxD) return undefined;

    Tracer._hit.p  = h.point;
    Tracer._hit.d  = h.distance;
    //Tracer._hit.o  = h.object;
    Tracer._hit.uv = h.uv;

	if (Tracer._offs){
		Tracer._hit.p.x -= (direction.x * Tracer._offs);
		Tracer._hit.p.y -= (direction.y * Tracer._offs);
		Tracer._hit.p.z -= (direction.z * Tracer._offs);
	}

	return Tracer._hit;
};

export default Tracer;