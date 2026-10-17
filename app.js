const dialog=document.querySelector('dialog');
if(dialog){const img=dialog.querySelector('img'),caption=dialog.querySelector('.viewer-caption'),zoom=dialog.querySelector('input');let origin;
 document.querySelectorAll('[data-sheet]').forEach(button=>button.addEventListener('click',()=>{origin=button;img.src=button.dataset.sheet;img.alt=button.dataset.caption;caption.textContent=button.dataset.caption;zoom.value=100;img.style.width='100%';dialog.showModal();}));
 zoom.addEventListener('input',()=>{img.style.width=zoom.value+'%'});
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{img.removeAttribute('src');origin?.focus()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
document.querySelectorAll('[role="tablist"]').forEach(list=>{
 const tabs=[...list.querySelectorAll(':scope > [role="tab"]')];
 function choose(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});
 const explorer=list.closest('.plan-explorer');if(!explorer)return;
 if(list.parentElement.classList.contains('level-panel')){explorer.dataset.format=tab.textContent;explorer.querySelectorAll('.level-panel > [role="tablist"]').forEach(other=>{const match=[...other.children].find(t=>t.textContent===tab.textContent);if(match){[...other.children].forEach(t=>{const active=t===match;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});}});}
 }
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();choose(tabs[next]);tabs[next].focus();});});
});

document.querySelectorAll('.render-carousel').forEach(gallery=>{
 const slides=[...gallery.querySelectorAll('.render-slide')],surface=gallery.querySelector('.render-slides');
 if(slides.length<2){gallery.querySelector('.carousel-controls').hidden=true;return;}
 const track=document.createElement('div');track.className='render-track';surface.append(track);
 const before=slides.at(-1).cloneNode(true),after=slides[0].cloneNode(true);
 [before,...slides,after].forEach(slide=>{slide.hidden=false;track.append(slide)});
 before.inert=after.inert=true;before.setAttribute('aria-hidden','true');after.setAttribute('aria-hidden','true');
 track.querySelectorAll('img').forEach(img=>img.draggable=false);
 let index=1,current=0,settleTimer,gesture=null,suppressClickUntil=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function position(dx=0,animate=false){track.style.transition=animate&&!reduced.matches?'transform 420ms ease':'none';track.style.transform=`translateX(calc(-${index*100}% + ${dx}px))`;}
 function announce(){current=(index-1+slides.length)%slides.length;slides.forEach((s,i)=>{s.inert=i!==current;s.setAttribute('aria-hidden',String(i!==current));});gallery.querySelector('.carousel-count').textContent=`${current+1} / ${slides.length}`;}
 function settle(){clearTimeout(settleTimer);if(index===0)index=slides.length;if(index===slides.length+1)index=1;position();announce();}
 function move(delta){settle();index+=delta;position(0,true);announce();settleTimer=setTimeout(settle,reduced.matches?0:440);}
 position();announce();
 gallery.querySelector('[data-prev]').addEventListener('click',()=>move(-1));gallery.querySelector('[data-next]').addEventListener('click',()=>move(1));
 gallery.addEventListener('keydown',e=>{if(e.target.closest('[data-sheet]')&&['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);slides[current].querySelector('button').focus({preventScroll:true});}});
 surface.addEventListener('dragstart',e=>e.preventDefault());
 surface.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 surface.addEventListener('pointerdown',e=>{if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;settle();suppressClickUntil=0;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,active:false,time:performance.now()};});
 window.addEventListener('pointermove',e=>{
  if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.active){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}if(Math.abs(dx)<8)return;gesture.active=true;surface.setPointerCapture(e.pointerId);surface.classList.add('dragging');}
  gesture.dx=dx;e.preventDefault();position(dx);
 },{passive:false});
 function release(e,cancelled=false){if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;gesture=null;surface.classList.remove('dragging');if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);if(!g.active)return;suppressClickUntil=performance.now()+500;e.preventDefault();const threshold=Math.min(100,surface.clientWidth*.18),quick=Math.abs(g.dx)>35&&performance.now()-g.time<250;if(!cancelled&&(Math.abs(g.dx)>threshold||quick)){index+=g.dx<0?1:-1;position(0,true);announce();settleTimer=setTimeout(settle,reduced.matches?0:440);}else{position(0,true);settleTimer=setTimeout(settle,reduced.matches?0:440);}}
 window.addEventListener('pointerup',e=>release(e));window.addEventListener('pointercancel',e=>release(e,true));
});
document.querySelectorAll('[data-previews]').forEach(card=>{
 const sources=[...new Set(JSON.parse(card.dataset.previews))],frame=card.querySelector('.card-image'),first=frame.querySelector('img');let timer,current=0,active=false;
 const zoom=document.createElement('div');zoom.className='preview-zoom';frame.append(zoom);
 const track=document.createElement('div');track.className='preview-track';zoom.append(track);track.append(first);
 sources.slice(1).forEach(src=>{const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';track.append(img)});
 const clone=first.cloneNode(true);clone.alt='';track.append(clone);
 function advance(){timer=null;if(!active)return;current++;track.style.transition='transform 650ms ease';track.style.transform=`translateX(-${current*100}%)`;}
 track.addEventListener('transitionend',e=>{if(e.target!==track||!active)return;if(current===sources.length){current=0;track.style.transition='none';track.style.transform='translateX(0)'}timer=setTimeout(advance,1200);});
 function start(){if(sources.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches||active)return;active=true;timer=setTimeout(advance,1200)}
 function stop(){active=false;clearTimeout(timer);timer=null;current=0;track.style.transition='none';track.style.transform='translateX(0)'}
 card.addEventListener('mouseenter',start);card.addEventListener('mouseleave',stop);card.addEventListener('focus',start);card.addEventListener('blur',stop);
});
