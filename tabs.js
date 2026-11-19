/* 分頁：nav 內的 role=tab 按鈕以 data-view 對應 #view-<名稱>。
   補上 aria-controls、tabpanel 角色、roving tabindex 與左右／Home／End 鍵。 */
function initTabs(){
  const tabs=[...document.querySelectorAll('nav [role="tab"]')];
  const panel=t=>document.getElementById("view-"+t.dataset.view);
  tabs.forEach(t=>{
    const p=panel(t);
    t.setAttribute("aria-controls",p.id);
    p.setAttribute("role","tabpanel");
    p.setAttribute("aria-labelledby",t.id);
  });
  function select(t,focus){
    tabs.forEach(x=>{
      const on=x===t;
      x.setAttribute("aria-selected",on);
      x.tabIndex=on?0:-1;
      panel(x).hidden=!on;
    });
    if(focus)t.focus();
  }
  tabs.forEach((t,i)=>{
    t.onclick=()=>select(t);
    t.onkeydown=e=>{
      const k={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:tabs.length-1}[e.key];
      if(k===undefined)return;
      e.preventDefault();
      select(tabs[(k+tabs.length)%tabs.length],true);
    };
  });
  select(tabs.find(t=>t.getAttribute("aria-selected")==="true")||tabs[0]);
}
initTabs();
