
/* 
Rules: Very simple. Collect the sun nodes while avoiding the astroids. Every 5 scores difficulty increases.

*/


    const	 	CLOCKTICK 	= 75;					// speed of run - move things every n milliseconds
    const		MAXSTEPS 	= 1000;					// length of a run before final score
	const show3d = true;
	//
	const ACTION_LEFT 		= 0;		   
    const ACTION_RIGHT 		= 1;
    const ACTION_UP 			= 2;		 
    const ACTION_DOWN 		= 3;
    const ACTION_STAYSTILL 		= 4;
    
   var camera, scene, renderer, player, gem;
   var mouse = new THREE.Vector2();
   var enemies = [];
   var enemySpeed = 3;
   var scoreDiv = document.getElementById( "score" );
   var bestScoreDiv = document.getElementById( "bestScore" );
   var sphereRadius = 10;
   var enemyRangeX = 550;
   var enemyRangeY = 700;
   var gemRange = 700;
   var score = 0;
   var best = 0;
   var stars = [];
   var starSpeed = 8;
   var difficulty = 0;

 	var self = this;						// needed for private fn to call public fn - see below 
 	
 	
 	function initWorld()
 	{
	//
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
	camera.position.z = 500;
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
   
    //
    
    enemies = [];
    stars = [];
   
    enemyRangeX = 550;
	enemyRangeY = 700;
	gemRange = 500;

	geometry = new THREE.SphereGeometry( 15, 20, 20 );
	material = new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/rock.jpg' )} );
	
	geometry2 = new THREE.SphereGeometry( 3, 3, 3 );
	material2 = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/glass.jpg' )} );

	radius = 1000;
	nboxes = 50;

	for(var i = 0; i<nboxes; i++){
	    var cube = new THREE.Mesh( geometry, material );
	    cube.castShadow = false;
	    cube.receiveShadow = false;
		scene.add( cube );
		cube.position.set(radius/2 - radius * Math.random(), radius/2 - radius * Math.random(), 0.0);
		enemies.push( cube );
	}
	for(var i = 0; i<nboxes*2; i++){
	    var star = new THREE.Mesh( geometry2, material2 );
		scene.add( star );
		star.position.set(radius/2 - radius * Math.random(), radius/2 - radius * Math.random(), 0.0);
		stars.push( star );
	}
	
	//
	
	gem = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/fire.jpg'), side:THREE.FrontSide}));
		gem.position.set( gemRange/2 - gemRange * Math.random(),
						 gemRange/2 - gemRange * Math.random(),
						  0.0);
	gem.castShadow = false;
	gem.receiveShadow = false;

	scene.add( gem );

	theagent = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/earthbare.jpg'), side:THREE.FrontSide}) );
				scene.add( theagent );
				window.addEventListener( 'mousemove', onMouseMove, false );
	
	//

	function onMouseMove(event) {

	// Update the mouse variable
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	
 	 // Make the sphere follow the mouse
  		var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
		vector.unproject( camera );
		var dir = vector.sub( camera.position ).normalize();
		var distance = - camera.position.z / dir.z;
		var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
		theagent.position.copy(pos);
  
	// Make the sphere follow the mouse
//	mouseMesh.position.set(event.clientX, event.clientY, 0);
	};


	var initSkybox = function() 
    {
        var skyGeometry = new THREE.SphereGeometry ( 3000, 60, 40 );	
        var uniforms = {
	    texture: { type: 't', value: THREE.ImageUtils.loadTexture('sky.jpg')}
        };
        var skyMaterial = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/ESO.jpg')});
  
        var theskybox = new THREE.Mesh ( skyGeometry, skyMaterial );
        theskybox.scale.set(-5, 5, 5);
        theskybox.eulerOrder = 'XYZ'
        theskybox.renderDepth = 500.0;
        scene.add( theskybox );						
  
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0,250,0);
        scene.add(light); //add light to world (From a nearby star, obviously)
    }	
        initSkybox();

	var render = function () {
	    requestAnimationFrame( render );

		for( var i = 0; i < enemies.length; i++ ){
		    if(enemies[i].position.y < -500){
	        //enemies[i].position.x = enemyRangeX/2 - enemyRangeX * Math.random();
	        enemies[i].position.y = 500;
		    } 
		    else{
		     if ( enemies[i].position.distanceTo( theagent.position ) < 2 * sphereRadius) { // if there's a player-enemy collision
			 	score = 0;
			 	enemySpeed = 3;
			 	starSpeed = 8;
			 	difficulty = 0;
			 }
			enemies[i].position.y -= enemySpeed;
			}
		}
		for( var i = 0; i < stars.length; i++ ){
		    if(stars[i].position.y < -500){
	        stars[i].position.y = 500;
		    }
		    stars[i].position.y -= starSpeed; 
		}
		gem.rotation.y += .02;
		theagent.rotation.x += .002;
		theagent.rotation.y += .02;

		var status = " <center> <b> Collect the Suns. For each multiple of 5 difficulty will increase.</b></BR>Score: " + score + " &nbsp Best Score: " + best + "  &nbsp Difficulty Level: " + difficulty + "</center>";
 		$("#user_span4").html( status );

 		if(theagent.position.distanceTo( gem.position ) < 2 * sphereRadius){
 			gem.position.x = gemRange/2 - gemRange * Math.random();
 			gem.position.y = gemRange/2 - gemRange * Math.random();
 			score ++;
 			if(score % 5 == 0){
 				enemySpeed++;
 				starSpeed++;
 				difficulty++;
 			}
 			if(score > best){
 				best = score;
 			}
 		}
		renderer.render(scene, camera);
    };
	render();
 	}
	initWorld();
	//

