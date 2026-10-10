const MU_SUN=1.32712e11, AU=1.496e8, MU_E=398600, R_LEO=6678, G0=9.80665;
// NASA Planetary Fact Sheet values
const DEST={
 venus:{n:"Venus",a:0.723,mu:324859,R:6052,rocky:true,atm:true,sci:60},
 mars:{n:"Mars",a:1.524,mu:42828,R:3390,rocky:true,atm:true,sci:80},
 jupiter:{n:"Jupiter",a:5.203,mu:126686534,R:71492,rocky:false,atm:false,sci:120},
 saturn:{n:"Saturn",a:9.537,mu:37931187,R:60268,rocky:false,atm:false,sci:140}};
const VEH={fh:{n:"Heavy-lift rocket (63.8 t to LEO)",cap:63.8,c:20},sls:{n:"SLS Block 1 (95 t to LEO)",cap:95,c:35},ss:{n:"Super-heavy reusable (150 t to LEO)",cap:150,c:45}};
const ENG={chem:{n:"Chemical (Isp 450 s)",isp:450,c:15,t:1},nuc:{n:"Nuclear thermal (Isp 900 s)",isp:900,c:30,t:1},ion:{n:"Ion drive (Isp 3000 s, slow spiral)",isp:3000,c:25,t:2.2}};
const POW={sl:{n:"Small solar arrays (5 kW at Earth, 2 t)",kw:5,t:2,c:5,solar:true},sx:{n:"Large solar arrays (12 kW at Earth, 4 t)",kw:12,t:4,c:10,solar:true},rtg:{n:"RTG (0.3 kW anywhere, 3 t)",kw:0.3,t:3,c:18,solar:false},fis:{n:"Fission reactor (10 kW anywhere, 6 t)",kw:10,t:6,c:25,solar:false}};
const ANT={sm:{n:"Small antenna (0.5 t)",g:1,t:0.5,c:3},lg:{n:"Large dish (1.5 t)",g:4,t:1.5,c:8}};
const $=id=>document.getElementById(id);
function fill(sel,obj){$(sel).innerHTML=Object.entries(obj).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join("")}
fill("dest",DEST);fill("veh",VEH);fill("eng",ENG);fill("pow",POW);fill("ant",ANT);

function plan(){
 const d=DEST[$("dest").value],v=VEH[$("veh").value],e=ENG[$("eng").value];
 const crew=+$("crew").value;
 const r1=AU,r2=d.a*AU,sa=(r1+r2)/2;
 const vc1=Math.sqrt(MU_SUN/r1),vc2=Math.sqrt(MU_SUN/r2);
 const vt1=Math.sqrt(MU_SUN*(2/r1-1/sa)),vt2=Math.sqrt(MU_SUN*(2/r2-1/sa));
 const vinf1=Math.abs(vt1-vc1),vinf2=Math.abs(vc2-vt2);
 const dvDep=Math.sqrt(vinf1*vinf1+2*MU_E/R_LEO)-Math.sqrt(MU_E/R_LEO);
 const rp=d.rocky?d.R+300:d.R*1.5;
 let dvArr=Math.sqrt(vinf2*vinf2+2*d.mu/rp)-Math.sqrt(d.mu*1.9/rp);
 const aero=$("aero").checked&&d.atm;
 if(aero)dvArr*=0.2;
 const dv=dvDep+dvArr;
 const days=Math.PI*Math.sqrt(Math.pow(2*sa,3)/(8*MU_SUN))/86400*e.t;
 const lander=$("lan").checked&&d.rocky;
 const pw=POW[$("pow").value],an=ANT[$("ant").value];
 let payload=pw.t+an.t+6+crew*3+($("cam").checked?1:0)+($("rad").checked?2:0)+(lander?5:0)+(aero?1.5:0);
 const R=Math.exp(dv/(G0*e.isp/1000));
 const s=0.12;
 const denom=1-s*(R-1);
 let m0=denom>0?payload/denom*R:Infinity;
 const cost=v.c+e.c+pw.c+an.c+crew*8+($("cam").checked?5:0)+($("rad").checked?8:0)+(lander?15:0)+(aero?5:0);
 const load=0.5+($("cam").checked?0.2:0)+($("rad").checked?1:0)+(lander?0.5:0)+crew*2;
 const avail=pw.solar?pw.kw/(d.a*d.a):pw.kw;
 const rate=an.g*4000/Math.pow(d.a+1,2);
 const need=50+($("cam").checked?50:0)+($("rad").checked?300:0)+(lander?100:0)+crew*100;
 const dose=crew?1.84*days:0;
 const sci=($("cam").checked?10:0)+($("rad").checked?18:0)+(lander?35:0);
 return{load,avail,rate,need,d,v,e,crew,dv,days,m0,cost,dose,sci,aero,lander,r1,r2,vinf1,vinf2};
}
function status(p){
 if(!isFinite(p.m0))return"The rocket equation says no: the fuel needed is heavier than the ship can carry. Try a higher-Isp engine.";
 if(p.m0>p.v.cap)return`Too heavy: ${p.m0.toFixed(0)} t, but ${p.v.n.split(" (")[0]} lifts ${p.v.cap} t. Use a bigger rocket, a more efficient engine, or less payload.`;
 if(p.cost>100)return`Over budget: ${p.cost} of 100 points.`;
 if(p.avail<p.load)return`Power failure: ${p.avail.toFixed(1)} kW available at ${p.d.n}, but the spacecraft needs ${p.load.toFixed(1)} kW. Sunlight is weak far from the Sun: use a bigger array or a nuclear source.`;
 if(p.rate<p.need)return`Communications failure: antenna gives ${Math.round(p.rate)} kbps at worst-case distance, but the mission needs ${p.need} kbps. Use the large dish or drop instruments.`;
 if(p.crew&&p.dose>600)return`Crew lost to radiation: ${p.dose.toFixed(0)} mSv exceeds the 600 mSv career limit. Use a faster engine or fly cargo only.`;
 return null;
}
function update(){
 $("crewv").textContent=$("crew").value;
 const p=plan();
 $("dv").textContent=p.dv.toFixed(2);
 $("days").textContent=Math.round(p.days);
 $("mass").textContent=isFinite(p.m0)?p.m0.toFixed(1):"impossible";
 $("cost").textContent=p.cost;
 $("dose").textContent=p.crew?Math.round(p.dose):"no crew";
 $("pwr").textContent=p.avail.toFixed(1)+" / "+p.load.toFixed(1);
 $("com").textContent=Math.round(p.rate)+" / "+p.need;
 $("s6").classList.toggle("bad",p.avail<p.load);
 $("s7").classList.toggle("bad",p.rate<p.need);
 $("s3").classList.toggle("bad",!isFinite(p.m0)||p.m0>p.v.cap);
 $("s4").classList.toggle("bad",p.cost>100);
 $("s5").classList.toggle("bad",p.crew>0&&p.dose>600);
 const pct=isFinite(p.m0)?Math.min(100,p.m0/p.v.cap*100):100;
 $("cap").textContent=isFinite(p.m0)?pct.toFixed(0)+"%":">100%";
 $("capbar").style.width=pct+"%";
 $("capbar").style.background=pct>=100?"var(--red)":"var(--teal)";
 return p;
}
// Drawing: radii use sqrt scale so Saturn fits
const cv=$("cv"),cx=cv.getContext("2d");
const CX=350,CY=230;
const sc=a=>28+Math.sqrt(a)*58*(1);
let anim=null;
function draw(p,t){
 cx.clearRect(0,0,700,460);
 cx.fillStyle="#f2b84b";cx.beginPath();cx.arc(CX,CY,9,0,7);cx.fill();
 const ra=sc(1),rb=sc(p.d.a);
 cx.strokeStyle="#27324a";cx.lineWidth=1;
 [ra,rb].forEach(r=>{cx.beginPath();cx.arc(CX,CY,r,0,7);cx.stroke()});
 // transfer ellipse: Earth side at angle 0 (right), target at angle PI
 const inner=p.d.a<1;
 const rpri=Math.min(ra,rb),rapo=Math.max(ra,rb);
 const a=(rpri+rapo)/2,c=(rapo-rpri)/2,b=Math.sqrt(a*a-c*c);
 // center offset along x: Earth at +x
 const ex=inner?CX+(rapo-a)*0+ (ra-a):CX+(ra-a)*-1*-1;
 // simple param: points from Earth (angle 0) to target (angle pi)
 cx.strokeStyle="#5ad1c4";cx.setLineDash([6,5]);cx.beginPath();
 const pt=u=>{ // u in [0,1]
  const th=Math.PI*u;
  // focus at Sun; polar form of ellipse with periapsis on the near side
  const rr=rpri*(1+((rapo-rpri)/(rapo+rpri)))/(1+((rapo-rpri)/(rapo+rpri))*Math.cos(inner?Math.PI-th:th));
  // for outer: start at periapsis (Earth, angle 0) -> apoapsis at pi. For inner: start at apoapsis (Earth) -> periapsis
  const ang=th;
  return[CX+rr*Math.cos(ang),CY-rr*Math.sin(ang)];
 };
 for(let i=0;i<=100;i++){const q=pt(i/100);i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])}
 cx.stroke();cx.setLineDash([]);
 // planets
 cx.fillStyle="#4aa3ff";cx.beginPath();cx.arc(CX+ra,CY,6,0,7);cx.fill();
 cx.fillStyle="#e8ecf3";cx.font="13px sans-serif";cx.fillText("Earth",CX+ra-14,CY+22);
 cx.fillStyle="#ff9d66";cx.beginPath();cx.arc(CX-rb,CY,7,0,7);cx.fill();
 cx.fillStyle="#e8ecf3";cx.fillText(p.d.n,CX-rb-12,CY+24);
 if(t!=null){const q=pt(t);cx.fillStyle="#fff";cx.beginPath();cx.arc(q[0],q[1],4,0,7);cx.fill();
  cx.fillStyle="#93a0b8";cx.fillText("Day "+Math.round(p.days*t),14,22);}
}
function launch(){
 const p=update(),err=status(p),m=$("msg");
 cancelAnimationFrame(anim);
 let t0=null;
 const lim=err?(isFinite(p.m0)&&p.m0>p.v.cap?0:0):1;
 if(err){m.className="fail";m.textContent="Mission failed on the pad. "+err;draw(p,null);return;}
 const step=ts=>{if(!t0)t0=ts;const t=Math.min(1,(ts-t0)/4000);draw(p,t);
  if(t<1)anim=requestAnimationFrame(step);else{
   const score=Math.round(p.d.sci*0.5+p.sci*(p.d.sci/40)+p.crew*25+(100-p.cost)*0.5-p.days/20);
   m.className="ok";
   m.innerHTML=`<b>Mission success: ${p.d.n} reached.</b><br>Score: <b>${Math.max(score,1)}</b> (science, crew, savings, speed). Power and communications were also sufficient. Try to beat it with a different design.`;
  }};
 m.className="";m.textContent="Transfer in progress...";anim=requestAnimationFrame(step);
}
["dest","veh","eng","pow","ant","crew","cam","rad","lan","aero"].forEach(id=>$(id).addEventListener("input",()=>{cancelAnimationFrame(anim);const p=update();draw(p,null);$("msg").className="";$("msg").textContent="Design updated. Press Launch."}));
$("launch").addEventListener("click",launch);
draw(update(),null);
