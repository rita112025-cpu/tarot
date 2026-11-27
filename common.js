/* 塔羅頁與雷諾曼頁共用：隨機、日期、跳脫、牌面圖片、翻牌動畫、「給 AI 解讀」區塊與提示詞組裝。
   必須在各頁的主程式之前載入。所有內容只在瀏覽器內處理，不送出任何資料。 */

/* ---------- 隨機與日期 ---------- */
function rand(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
/* Fisher–Yates，回傳洗過的新陣列，不改動原陣列 */
function shuffle(src){const a=src.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function todayKey(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
/* FNV-1a 雜湊，同一字串永遠得到同一個整數 */
function hashKey(key){let h=2166136261;for(const ch of key){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}

/* ---------- 呈現 ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
/* 牌面圖片：cards/sm 為 240px、cards/thumb 為 400px，瀏覽器依 sizes 與螢幕密度自行挑選。
   sizes 是該圖在畫面上的大約 CSS 寬度；首屏的牌用 eager 並提高優先權。 */
function cardImg(file,{alt="",sizes="200px",eager=false,cls=""}={}){
  const load=eager?'fetchpriority="high"':'loading="lazy"';
  return `<img${cls?` class="${cls}"`:""} src="cards/thumb/${file}" srcset="cards/sm/${file} 240w, cards/thumb/${file} 400w" sizes="${sizes}" alt="${esc(alt)}" width="400" height="600" ${load}>`;
}
function openLater(els){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  els.forEach((el,i)=>setTimeout(()=>el.classList.add("open"),reduce?0:150+i*350));
}

/* ---------- 給 AI 解讀：只顯示與複製文字，不送出任何資料 ---------- */
/* 頁面上只放 <section class="ai" id="..." hidden></section>，內容在這裡統一產生 */
document.querySelectorAll("section.ai[id]").forEach(sec=>{
  const id=sec.id;
  sec.setAttribute("aria-labelledby",id+"-t");
  sec.innerHTML=`<h2 id="${id}-t">給 AI 解讀</h2>
      <p class="note">已將本次占卜整理成 AI 可讀格式。本頁不會自動送出，貼到哪個 AI 由你決定。</p>
      <button type="button" class="ai-copy" data-copy="${id}">複製提示詞</button>
      <p class="note" id="${id}-s" aria-live="polite"></p>
      <pre class="ai-box" tabindex="0" role="region" aria-label="AI 解讀提示詞"><code id="${id}-p"></code></pre>`;
});
function showAi(id,text){
  document.getElementById(id+"-p").textContent=text;   // 問題原樣放入，一律走 textContent
  document.querySelector("#"+id+" .ai-box").scrollTop=0;
  document.getElementById(id+"-s").textContent="";
  document.getElementById(id).hidden=false;
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){}
  const a=document.createElement("textarea");a.value=text;a.setAttribute("readonly","");
  a.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(a);a.select();
  let ok=false;try{ok=document.execCommand("copy");}catch(e){}
  a.remove();return ok;
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-copy]");if(!b)return;
  const id=b.dataset.copy,code=document.getElementById(id+"-p"),s=document.getElementById(id+"-s");
  const ok=await copyText(code.textContent);
  s.textContent=ok?"已複製。":"無法自動複製，請在下方框內全選後手動複製。";
  if(!ok){const r=document.createRange();r.selectNodeContents(code);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);}
});
const NO_Q_STEP=["整體局勢","由於沒有具體問題，請以整體局勢與目前最值得注意的主題為主，不要自行假設使用者是在問感情、工作或財務。"];
const Q_STEP=["直接回答問題","針對【占問問題】給出明確、具體的解讀，不要只講抽象象徵。"];
const REMIND_STEP=["實際提醒","列出：\n- 現在較有利的做法\n- 現在需要避免的做法\n- 最值得觀察的訊號"];
function assemble({intro,rules,question,spread,body,steps}){
  const q=(question||"").trim(),O=["一","二","三","四","五"];
  const all=steps.concat([q?Q_STEP:NO_Q_STEP,REMIND_STEP]);
  return [intro,"","重要：",...rules.map((r,i)=>(i+1)+". "+r),"","【占問問題】",q||"未填寫具體問題。","","【牌陣】",spread,"",...body,"",
    "請依以下順序解讀：","",...all.flatMap(([t,b],i)=>[O[i]+"、"+t,b,""]),
    "請不要把象徵性解讀描述成已確定會發生的客觀事件。"].join("\n");
}
