/*

Demonstrably difficult Problem:
We were asked to show that a problem was difficult to solve and in the
case of this world, this is not a particularly difficult task. In this case, the problem is that with the 
code I have written, there is a direct correlation between the view distance of the agent, and performance/lag.
The more radial squares I allow the bot to detect, the worse the game runs. Of course there is 
presumably a code solution to this problem, but unfortunately if this is the case, it is beyond what I could
manage given both the time frame, and also the new language. Currently the agent scans a radius of 2 boxes, 
while prioritizing avoiding the enemy. 

Game Logic: 
Each Dollar cube is worth $100. Each time Trump catches hillary, he takes money from her. (Probably has 
something to do with a lawsuit.)  
Whichever candidate comes out of the race with the most money will be the winner and their respective planet
will float directly over the game board.

Features:
-Planet Trump & Planet Clinton will move in and out as the lead switches between the two. 
 Whoever takes the lead originally will push Earth out of the way. 
-Game will end when the National Anthem (America the brave) ends.
-Above the game, the following can be tracked: The current winning candidate, the current collected money, 
 the total money stolen by trump, and the overall score which is the balance of the two. 

Known Bugs:
Unfortunately, the AI version of this game is sometimes quite laggy and can remove dollars from the board
in absense of any collision. This is because I am not actually using collision detection 
(unlike my SpaceHero game), instead I am using array values to detect whether or not a dollar should be 
removed. 

*/

// =============================================================================================
// World must define these:
 
const   CLOCKTICK   = 100;         // speed of run - move things every n milliseconds
const   MAXSTEPS  = 730;         // length of a run before final score
 
//---- global constants: -------------------------------------------------------
const gridsize = 50;            // number of squares along side of world     
const NOBOXES =  Math.trunc ( 40);
const squaresize = 100;         // size of square in pixels
const MAXPOS = gridsize * squaresize;   // length of one side in pixels 
const SKYCOLOR  = 0xddffdd;       // a number, not a string 
const BLANKCOLOR  = SKYCOLOR ;      // make objects this color until texture arrives (from asynchronous file read)

const show3d = true;            // Switch between 3d and 2d view (both using Three.js) 
 
const startRadiusConst    = MAXPOS * 1 ;   // distance from centre to start the camera at
const skyboxConst     = MAXPOS * 1 ;    // where to put skybox 
const maxRadiusConst    = MAXPOS * 5  ;   // maximum distance from camera we will render things  

//--- Mind can pick one of these actions -----------------

const ACTION_LEFT     = 0;       
const ACTION_RIGHT    = 1;
const ACTION_UP       = 2;     
const ACTION_DOWN     = 3;
const ACTION_STAYSTILL    = 4;

// in initial view, (smaller-larger) on i axis is aligned with (left-right)
// in initial view, (smaller-larger) on j axis is aligned with (away from you - towards you)

// contents of a grid square

const GRID_BLANK  = 0;
const GRID_WALL   = 1;
const GRID_MAZE   = 2;
 
// --- some useful random functions  -------------------------------------------


function randomfloatAtoB ( A, B )      
{
 return ( A + ( Math.random() * (B-A) ) );
}

function randomintAtoB ( A, B )      
{
 return  ( Math.round ( randomfloatAtoB ( A, B ) ) );
}
  
function randomBoolean()       
{
 if ( Math.random() < 0.5 ) { return false; }
 else { return true; }
}


//---- start of World class -------------------------------------------------------
 
function World() { 
  var BOXHEIGHT;    // 3d or 2d box height 
  var GRID  = new Array(gridsize);      
  var WALLS   = new Array ( 4 * gridsize );  
  var MAZE  = new Array ( NOBOXES*4);
  var theagent, theenemy;

    // enemy and agent position on squares
  var ei, ej, ai, aj;

  var badsteps;
  var goodsteps;
  var step;
  var self = this;              

  //
  var enemies = [];
  var mats = [];
  var enemyRangeX = 5000;
  var enemyRangeY = 3000;
  var enemySpeed = 3;
  var radius = 15000;
  var nboxes = 3;

  geometry = new THREE.SphereGeometry( 650, 700, 700 );
  material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/hil.jpg' )} );
  material2 = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/tp.jpg' )} );
  material3 = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/earthbare.jpg' )});
  materialfire = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/fire.jpg' )});
  mats.push(material);
  mats.push(material2);
  mats.push(material3);


  var params = {opacity: 0.25};
   
  function initGrid()
  {
    for (var i = 0; i < gridsize ; i++) 
    {
      GRID[i] = new Array(gridsize);    

      for (var j = 0; j < gridsize ; j++) 
      {
        GRID[i][j] = GRID_BLANK ;
      }
    }
  }

  function occupied ( i, j )   
  {
    if ( ( ei == i ) && ( ej == j ) ) return true;   
    if ( ( ai == i ) && ( aj == j ) ) return true;

    if ( GRID[i][j] == GRID_WALL ) return true;   
   
    return false;
  }

 
  function translate ( x ) 
  {
    return ( x - ( MAXPOS/2 ) );
  }

//--- skybox ----------------------------------------------------------------------------------------------

  function initSkybox() 
  {
    var skyGeometry = new THREE.SphereGeometry ( 2000, 60, 40 );  
    var uniforms = { texture: { type: 't', value: THREE.ImageUtils.loadTexture('sky.jpg')}};
    var skyMaterial = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/ESO1.jpg')});
  
    var theskybox = new THREE.Mesh ( skyGeometry, skyMaterial );
    theskybox.scale.set(-5, 5, 5);
    theskybox.eulerOrder = 'XYZ'
    theskybox.renderDepth = 1000.0;
    threeworld.scene.add( theskybox );            
  
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    threeworld.scene.add(light); //add light to world (From a nearby star, obviously)
  
    var floorMaterial = new THREE.MeshBasicMaterial( {map: THREE.ImageUtils.loadTexture('/uploads/RossFraney3/map.png'), side:THREE.DoubleSide, opacity:params.opacity, transparent: true} );
    var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -50;
    floor.position.x = -50;
    floor.rotation.x = Math.PI / 2;
    threeworld.scene.add(floor);

    /*for(var i = 0; i<nboxes; i++){
    var cube = new THREE.Mesh( geometry, mats[i] );
    threeworld.scene.add( cube );
    cube.position.set(radius/2 - radius * Math.random(), radius/2 - radius * Math.random(), radius/2 - radius * Math.random());
    enemies.push( cube );
    }*/


    var hillplan = new THREE.Mesh( geometry, mats[0] );
    threeworld.scene.add( hillplan );
    hillplan.position.set(-1000, 500, -5000);
    enemies.push( hillplan );

    var donaldplan = new THREE.Mesh( geometry, mats[1] );
    threeworld.scene.add( donaldplan );
    donaldplan.position.set(1000, 500, -5000);
    enemies.push( donaldplan );

    var earth = new THREE.Mesh( geometry, mats[2] );
    threeworld.scene.add( earth );
    earth.position.set(0, 2500, -500);
    enemies.push( earth );
  }

  function loadTextures()
  {
    var manager = new THREE.LoadingManager();   
    var loader = new THREE.OBJLoader( manager );
      
    loader.load( "/uploads/RossFraney3/trump.obj", buildenemy );



// load simple OBJ
   loader.load( "/uploads/RossFraney3/hil.obj", buildagent );
  
  //loader.load( "/uploads/RossFraney3/low-poly-pot-of-gold.obj", buildpot );

// load OBJ plus MTL (plus TGA files) 

    var loader1 = new THREE.TextureLoader();
    loader1.load ( '/uploads/RossFraney3/glass.jpg', function ( thetexture ) {      
    thetexture.minFilter = THREE.LinearFilter;
    paintWalls ( new THREE.MeshBasicMaterial( { map: thetexture, opacity:0, transparent:true } ) );
    } ); 

    //var loader2 = new THREE.TextureLoader();
    //loader2.load ( '/uploads/RossFraney3/money-bag.jpg', function ( thetexture ) {      
    //thetexture.minFilter = THREE.LinearFilter;
    paintMaze ( new THREE.MeshLambertMaterial({ color: 0xc47f34 } ) );
   

    /*var loader3 = new THREE.TextureLoader();
    loader3.load ( '/uploads/RossFraney3/hillary-clinton.jpg', function ( thetexture ) {      
    thetexture.minFilter = THREE.LinearFilter;
    theagent.material =  new THREE.MeshBasicMaterial( { map: thetexture } );
    } ); 

    var loader4 = new THREE.TextureLoader();
    loader4.load ( '/uploads/RossFraney3/donald-trump.jpg',  function ( thetexture ) {      
    thetexture.minFilter = THREE.LinearFilter;
    theenemy.material =  new THREE.MeshBasicMaterial( { map: thetexture } );
    } ); */
}

function buildenemy ( object ) 
{ 
  object.scale.multiplyScalar ( 6 );        // make 3d object n times bigger 
  var material2 = new THREE.MeshLambertMaterial({ color: 0xff3300 });
  object.traverse( function(child) {
  if (child instanceof THREE.Mesh) {


    child.material = material2;

// enable casting shadows

    child.castShadow = false;

    child.receiveShadow = false;
}
});
  theenemy = object;
  threeworld.scene.add( theenemy ); 
}


function buildagent ( object ) 
{ 
  object.scale.multiplyScalar ( 6 );
  var material2 = new THREE.MeshLambertMaterial({ color: 0x00ccff });
object.traverse( function(child) {
if (child instanceof THREE.Mesh) {


  child.material = material2;

// enable casting shadows

  child.castShadow = false;

  child.receiveShadow = false;
}
});

  theagent = object;
  threeworld.scene.add( theagent ); 
}



// --- add fixed objects ---------------------------------------- 
   
function drawMeteors()
{
  for( var i = 0; i < enemies.length; i++ ){
    if(enemies[i].position.y < -enemyRangeY){
      enemies[i].position.x = enemyRangeX/2 - enemyRangeX * Math.random();
      enemies[i].position.y = enemyRangeY;
    }
  //enemies[i].position.y -= enemySpeed;
  enemies[i].rotation.y += .01;
  enemies[i].rotation.x += .01;
  } 
  if(goodsteps > badsteps){
    //enemies[1].position.y -= enemySpeed*15;
    if(enemies[0].position.y < 2500){
    enemies[0].position.y += enemySpeed*15;
    enemies[0].rotation.x += .9;
    enemies[0].rotation.z += .9;
  }
  if(enemies[0].position.x > 0){
    enemies[0].position.x -= enemySpeed*15;
    enemies[0].rotation.x += .9;
    enemies[0].rotation.z += .9;
  }
   if(enemies[2].position.x > -5000)
      enemies[2].position.x -= enemySpeed*15;

  if(enemies[0].position.z < -500){
    enemies[0].position.z += enemySpeed*15;
    enemies[0].rotation.x += .9;
    enemies[0].rotation.z += .9;
  }
  if(enemies[1].position.x < 1000 )
    enemies[1].position.x += enemySpeed*15;
  if(enemies[1].position.z > -5000 )
    enemies[1].position.z -= enemySpeed*15;
  if(enemies[1].position.y > 500 )
      enemies[1].position.y -= enemySpeed*15;
  }
  else if(goodsteps < badsteps){
    //enemies[0].position.y -= enemySpeed*20;
    if(enemies[1].position.y < 2500){
      enemies[1].position.y += enemySpeed*15;
      enemies[1].rotation.x += .9;
      enemies[1].rotation.z += .9;
    }
    if(enemies[1].position.x > 0){
      enemies[1].position.x -= enemySpeed*15;
      enemies[1].rotation.x += .9;
      enemies[1].rotation.z += .9;
    }
    if(enemies[2].position.x > -5000)
      enemies[2].position.x -= enemySpeed*15;

    if(enemies[1].position.z < -500){
      enemies[1].position.z += enemySpeed*15;
      enemies[1].rotation.x += .9;
      enemies[1].rotation.z += .9; 
    }
    if(enemies[0].position.x > -1000 )
      enemies[0].position.x -= enemySpeed*15;
    if(enemies[0].position.z > -5000 )
      enemies[0].position.z -= enemySpeed*15;
    if(enemies[0].position.y > 500 )
      enemies[0].position.y -= enemySpeed*15;
}
}
 
function initLogicalWalls()   // set up logical walls in data structure, whether doing graphical run or not 
{
 for (var i = 0; i < gridsize ; i++) 
  for (var j = 0; j < gridsize ; j++) 
   if ( ( i==0 ) || ( i==gridsize-1 ) || ( j==0 ) || ( j==gridsize-1 ) )
   {
      GRID[i][j] = GRID_WALL ;     
   }
}


function initThreeWalls()   // graphical run only, set up blank boxes, painted later  
{
 var t = 0;
 for (var i = 0; i < gridsize ; i++) 
  for (var j = 0; j < gridsize ; j++) 
   if ( GRID[i][j] == GRID_WALL )
   {
   var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );      
   var thecube  = new THREE.Mesh( shape );
   thecube.material.color.setHex( BLANKCOLOR  );        
 
       thecube.position.x = translate ( i * squaresize );       // translate my simple (i,j) block-numbering coordinates to three.js (x,y,z) coordinates 
       thecube.position.z = translate ( j * squaresize );     
       thecube.position.y =  0; 
 
   threeworld.scene.add(thecube);
   WALLS[t] = thecube;        // save it for later
   t++; 
   }
}


function paintWalls ( material )     
{
 for ( var i = 0; i < WALLS.length; i++ )
 { 
   if ( WALLS[i] )  WALLS[i].material = material;
 }
}


function initLogicalMaze()     
{
 for ( var c=1 ; c <= NOBOXES; c++ )
 {
    var i = randomintAtoB(1,gridsize-3);  // inner squares are 1 to gridsize-2
    var j = randomintAtoB(1,gridsize-3);

    GRID[i][j] = GRID_MAZE; // problem in interaction between hereeeeeeeeeeeee    
 }
}

function initThreeMaze()        
{
  for (var i = 0; i < gridsize; i++) 
    for (var j = 0; j < gridsize; j++) 
      if ( GRID[i][j] == GRID_MAZE && MAZE[i+j] == null ) // and heeeeere, the below isnt executing for all 
      {
        var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );       
        var thecube  = new THREE.Mesh( shape );
        thecube.material.color.setHex( BLANKCOLOR  );       

        thecube.position.x = translate ( i * squaresize );    
        thecube.position.z = translate ( j * squaresize );    
        thecube.position.y =  0;  
 
        threeworld.scene.add(thecube);
        MAZE[i+j] = thecube;  

   }
}

function paintMaze ( material )    
{
 for ( var i = 0; i < MAZE.length; i++ )
 { 
   if ( MAZE[i] )  MAZE[i].material = material, MAZE[i].castShadow = true, MAZE[i].receiveShadow = true;
 }
}


// --- enemy functions -----------------------------------


function drawEnemy()    // given ei, ej, draw it 
{
if ( theenemy )
{
  var x = translate ( ei * squaresize );    
  var z = translate ( ej * squaresize );    
  var y =   ( -1 * squaresize );    

 theenemy.position.x = x;
 theenemy.position.y = y;
 theenemy.position.z = z;
 
 threeworld.lookat.copy ( theenemy.position );    // if camera moving, look back at where the enemy is  
 threeworld.lookat.y = ( squaresize * 1.5 );     // point camera higher up
}
}


function initLogicalEnemy()
{
// start in random location:
 var i, j;
 do
 {
  i = randomintAtoB(1,gridsize-2);
  j = randomintAtoB(1,gridsize-2);
 }
 while ( occupied(i,j) );     // search for empty square 

 ei = i;
 ej = j;
}


/*function initThreeEnemy()
{
 var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );      
 theenemy = new THREE.Mesh( shape );
 theenemy.material.color.setHex( BLANKCOLOR  ); 
 drawEnemy();     
}*/


function moveLogicalEnemy()
{ 
// move towards agent 
// put some randomness in so it won't get stuck with barriers 

 var i, j;
 if ( ei < ai ) i = randomintAtoB(ei, ei+1); 
 if ( ei == ai ) i = ei; 
 if ( ei > ai ) i = randomintAtoB(ei-1, ei); 

 if ( ej < aj ) j = randomintAtoB(ej, ej+1); 
 if ( ej == aj ) j = ej; 
 if ( ej > aj ) j = randomintAtoB(ej-1, ej); 
 
 if ( ! occupied(i,j) )   // if no obstacle then move, else just miss a turn
 {
  ei = i;
  ej = j;
 }
}

// --- agent functions -----------------------------------


function drawAgent()  // given ai, aj, draw it 
{
if ( theagent )
{
  var x = translate ( ai * squaresize );    
  var z = translate ( aj * squaresize );    
  var y =   ( -1 * squaresize );    

 theagent.position.x = x;
 theagent.position.y = y;
 theagent.position.z = z;
 
 threeworld.follow.copy ( theagent.position );    // follow vector = agent position (for camera following agent)
 threeworld.follow.y = ( squaresize * 1.5 );     // put camera higher up
}
}


function initLogicalAgent()
{
// start in random location:
 var i, j;
 do
 {
  i = randomintAtoB(1,gridsize-2);
  j = randomintAtoB(1,gridsize-2);
 }
 while ( occupied(i,j) );     // search for empty square 

 ai = i;
 aj = j;
}

/*function initThreeAgent()
{
 var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );      
 theagent = new THREE.Mesh( shape );
 theagent.material.color.setHex( BLANKCOLOR );  
 drawAgent();       
}*/


function moveLogicalAgent( a )      // this is called by the infrastructure that gets action a from the Mind 
{ 
  var i = ai;
  var j = aj;  

  if ( a == ACTION_LEFT )   i--;
  else if ( a == ACTION_RIGHT )   i++;
  else if ( a == ACTION_UP )    j++;
  else if ( a == ACTION_DOWN )  j--;
  
  if ( !occupied(i,j) ) {
  ai = i;
  aj = j;
  }
  
   if(GRID[ai][aj+1] == GRID_MAZE){
    aj++;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai][aj-1] == GRID_MAZE){
    aj--;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai+1][aj] == GRID_MAZE){
    ai++;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai-1][aj] == GRID_MAZE){
    ai--;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai][aj+2] == GRID_MAZE){
    aj+=2;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai][aj-2] == GRID_MAZE){
    aj-=2;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai+2][aj] == GRID_MAZE){
    ai+=2;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
  else if(GRID[ai-2][aj] == GRID_MAZE){
    ai = ai-=2;
    GRID[ai][aj] = GRID_BLANK;
    threeworld.scene.remove(MAZE[ai+aj]);
    goodsteps++;
    soundCash();
  }
}


function keyHandler(e)    
// user control 
// Note that this.takeAction(a) is constantly running at same time, redrawing the screen.
{
    if (e.keyCode == 37)  moveLogicalAgent ( ACTION_LEFT  );
    if (e.keyCode == 38)  moveLogicalAgent ( ACTION_DOWN    );
    if (e.keyCode == 39)  moveLogicalAgent ( ACTION_RIGHT   );
    if (e.keyCode == 40)  moveLogicalAgent ( ACTION_UP  );
    if (e.keyCode == 32) ai = randomintAtoB(1,gridsize-2), aj = randomintAtoB(1,gridsize-2);
}



// --- score: -----------------------------------


function badstep()      // is the enemy within one square of the agent
{
 if ( ( Math.abs(ei - ai) < 2 ) && ( Math.abs(ej - aj) < 2 ) ) return true;
 else return false;
}

function agentBlocked()     // agent is blocked on all sides, run over
{
 return (   occupied (ai-1,aj)    && 
    occupied (  ai+1,aj)    &&
    occupied (  ai,aj+1)    &&
    occupied (  ai,aj-1)  );    
} 

function updateStatusBefore(a)
{
// this is called before anyone has moved on this step, agent has just proposed an action
// update status to show old state and proposed move 
 var x = self.getState();
}


function   updateStatusAfter()    // agent and enemy have moved, can calculate score
{
 // new state after both have moved
 var y = self.getState();
 //var status = " &nbsp; y = (" + y.toString() + ") <BR> "; 
 //$("#user_span3").html( status );

 //var score = self.getScore();

 var status = "<font size = 150><center> <b> Collected: $" + goodsteps*100 + 
    " &nbsp; Sued for: $" + badsteps*100 + 
    " &nbsp; Score: $" + (goodsteps-badsteps)*100 + "</b> </center></font>" ; 
 $("#user_span4").html( status );

  if(goodsteps > badsteps){
    var status = "<font color=blue> <center> <b> Time Left In Anthem: " + (730 - step) + " &nbsp; In The Lead: Hillary Clinton! </b> </center> </font>"

  }
  else if(goodsteps < badsteps){
    var status = "<font color=red> <center> <b> Time Left In Anthem: " + (730 - step) + " &nbsp; In The Lead: Donal Trump!! </b> <center> </font>"

  }
  else if(goodsteps == badsteps){
    var status = "<font color=green><center> <b> Time Left In Anthem: " + (730 - step) + " &nbsp; In The Lead: America </b> <center> </font>"
  }
  $("#user_span5").html( status );
}

//--- public functions / interface / API ----------------------------------------------------------

  this.endCondition;      // If set to true, run will end. 

this.newRun = function() 
{

// (subtle bug) must reset variables like these inside newRun (in case do multiple runs)

  this.endCondition = false;
  badsteps = 0; 
  goodsteps = 0;
  step = 0;

 // for all runs:

  initGrid();
  initLogicalWalls(); 
  initLogicalMaze();
  initLogicalAgent();
  initLogicalEnemy();

 // for graphical runs only:

  if ( THREE_RUN  )
  {
  if ( show3d )
  {
   BOXHEIGHT = squaresize;
   threeworld.init3d ( startRadiusConst, maxRadiusConst, SKYCOLOR  );   
  }      
  else
  {
   BOXHEIGHT = 1;
   threeworld.init2d ( startRadiusConst, maxRadiusConst, SKYCOLOR  );          
  }

  initSkybox();
  initMusic();
  
  // Set up objects first:
  initThreeWalls(); 
  initThreeMaze();
  //initThreeAgent();
  //initThreeEnemy();

  // Then paint them with textures - asynchronous load of textures from files.

  loadTextures(); 

  document.onkeydown = keyHandler;  
  }
};
this.getState = function()
{
 var x = [ ai, aj, ei, ej ];
  return ( x );  
};

this.takeAction = function ( a )
{
  step++;

  if ( THREE_RUN  )
   updateStatusBefore(a);     // show status line before moves 

  moveLogicalAgent(a);

  if ( ( step % 2 ) == 0 )    // slow the enemy down to every nth step
    moveLogicalEnemy();


  if ( badstep() )
   badsteps++;
  //else
   //goodsteps++;

  if ( THREE_RUN  )
  {
   drawMeteors();
   drawAgent();
   drawEnemy();
   updateStatusAfter();     // show status line after moves  
  }


  if ( agentBlocked() )     // if agent blocked in, run over 
  {
  this.endCondition = true;
  goodsteps = 0;      // you score zero as far as database is concerned        
    if ( THREE_RUN  )
    {
   musicPause();
   soundAlarm();
  }
  }

};

this.endRun = function()
{
 if ( THREE_RUN  )
 {
  musicPause(); 
  if ( this.endCondition )
    $("#user_span6").html( " &nbsp; <font color=red> <B> Agent trapped. Final score zero. </B> </font>   "  );
  else
    if(goodsteps > badsteps)
      $("#user_span6").html( " &nbsp; <center><font color=red> <B> Run over. Winner = Hillary! </B> </font></center>   "  );
    else if(goodsteps < badsteps)
      $("#user_span6").html( " &nbsp; <center><font color=red> <B> Run over. Winner = ...... Really?.. </B> </font></center>   "  );

 }
};


this.getScore = function()
{
 return ( ( goodsteps / step ) * 100 );
};


}

//---- end of World class -------------------------------------------------------


// --- music and sound effects ----------------------------------------

function initMusic()
{
  // put music element in one of the spans
    var x = "<audio  id=theaudio  src=/uploads/RossFraney3/usa-anthem.mp3  autoplay loop> </audio>" ;
    $("#user_span1").html( x );
} 
 

function musicPlay()  
{
  // jQuery does not seem to parse pause() etc. so find the element the old way:
  document.getElementById('theaudio').play();
}


function musicPause() 
{
  document.getElementById('theaudio').pause();
}


function soundCash()
{
  var x = "<audio  src=/uploads/RossFraney/chaching.mp3   autoplay> </audio>";
    $("#user_span2").html( x );
}




