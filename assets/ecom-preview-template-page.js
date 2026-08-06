/* Publish by EComposer at 2024-07-24 07:54:26*/

                (function(){
                    const Func = (function() {
                        'use strict';
window.__ectimmers = window.__ectimmers ||{};window.__ectimmers["ecom-vskmg5yg8ad"]=  window.__ectimmers["ecom-vskmg5yg8ad"] || {};
if(!this.$el)return;const e=this.$el,i=e.querySelector(".ecom-text_view-more-btn"),t=e.querySelector(".ecom-text_view-less-btn"),n=e.querySelector(".text-content.ecom-html");!n||(i&&i.addEventListener("click",()=>{n.classList.remove("ecom-text--is-mark"),n.style.maxHeight="",i.style.display="none",t.style.display=""}),t&&t.addEventListener("click",()=>{n.classList.add("ecom-text--is-mark"),n.style.maxHeight="var(--ecom-text-height)",t.style.display="none",i.style.display=""}))

                    });
                    
                        document.querySelectorAll('.ecom-vskmg5yg8ad').forEach(function(el){
                            Func.call({$el: el, id: 'ecom-vskmg5yg8ad', settings: {},isLive: true});
                        });
                    
                        document.querySelectorAll('.ecom-63pyts4br7g').forEach(function(el){
                            Func.call({$el: el, id: 'ecom-63pyts4br7g', settings: {},isLive: true});
                        });
                    

                })();
            
                (function(){
                    const Func = (function() {
                        'use strict';
window.__ectimmers = window.__ectimmers ||{};window.__ectimmers["ecom-ebscykjokko"]=  window.__ectimmers["ecom-ebscykjokko"] || {};
function t(i){if(i&&i.length>0){const a=document.createElement("div");return a.innerHTML=i,a.textContent||a.innerText||""}return""}function o(i,a,r){if(!i||!a)return"";let m=i.split(" ");return m.length<a?i:m.slice(0,a).join(" ")+(r||"")}if(!this.$el)return;const n=this.$el,c=this.isLive,f=n.querySelectorAll(".ecom__element.element__image-hotspot .element__image-hotspot--text");this.isLive||n.querySelectorAll(".element__image-hotspot--content-btn").forEach(i=>{i.addEventListener("click",function(a){a.preventDefault(),a.stopPropagation();let r=this.getAttribute("href");r&&r.indexOf("/product")>=0&&(a.preventDefault(),window.open(window.EComposer.routes.domain+r))})});const l=async function(i){i.querySelector(".element__image-hotspot--content-image").style.opacity=0;const a=i.querySelector(".ecom-hotspots-container-tooltip");if(a&&a.classList.add("ecom-loading-image"),!window.EComposer||!window.EComposer.getProduct)return console.log("EComposer theme helper not enabled"),!1;const r=i.getAttribute("data-handle"),m=i.getAttribute("data-limit");var s;if(i.dataset.product?(s=JSON.parse(i.dataset.product),s.handle!==r&&(s=await window.EComposer.getProduct(r))):s=await window.EComposer.getProduct(r),s&&s.id){const g=i.querySelector(".element__image-hotspot--content-image"),p=i.querySelector(".element__image-hotspot--content-title"),w=i.querySelector(".element__image-hotspot--content-text"),k=i.querySelectorAll(".element__image-hotspot--content-btn"),v=i.querySelector(".element__image-hotspot--content-prices");if(g&&(g.src=s.featured_image),p&&(p.innerText=s.title),w&&(w.innerText=o(t(s.description),parseInt(m!=null?m:20),"...")||""),k.forEach(function(h){h.href=s.url}),v){let h=`<span class="element__image-hotspot--content-price">${window.EComposer.formatMoney(s.price)}</span>`;s.price<s.compare_at_price&&(h+=`<span class="element__image-hotspot--content-price--regular">${window.EComposer.formatMoney(s.compare_at_price)}</span>`),v.innerHTML=h}i.dataset.product=JSON.stringify(s),a&&a.classList.remove("ecom-loading-image"),i.querySelector(".element__image-hotspot--content-image").style.opacity=1}},$=window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth;f.forEach((i,a)=>{const r=i.querySelector(".element__image-hotspot--btn"),m=i.closest(".ecom-block.ecom-core"),s=i.closest(".core__column--wrapper"),g=i.closest(".ecom-row.ecom-core"),p=i.querySelector(".element__image-hotspot--content");if(i.getAttribute("data-source")==="link"){let h=i.getAttribute("data-redirect-link")?JSON.parse(i.getAttribute("data-redirect-link")):null;r.addEventListener("click",()=>{this.isLive&&(h!=null&&h.href?h.target?window.open(h.href,"_blank"):window.location.href=h.href:window.location.reload())})}else{let h=function(){r.addEventListener("click",()=>{if(p.classList.contains("ecom-hotspot-actived"))_(p),p.classList.remove("ecom-hotspot-actived"),m&&(m.style.zIndex="unset"),s&&(s.style.zIndex="unset"),g&&(g.style.zIndex="unset");else{if(e(p),p.classList.add("ecom-hotspot-actived","ecom_current_click"),$<768){var C=window.pageYOffset;window.document.addEventListener("scroll",function(){var z=window.pageYOffset;(C-z>100||z-C>100)&&(p.classList.remove("ecom-hotspot-actived"),document.removeEventListener("click",v),_(p))})}i.getAttribute("data-source")==="product"&&c&&(clearTimeout(I),I=setTimeout(()=>l(i),500)),setTimeout(()=>{document.addEventListener("click",v),p.classList.remove("ecom_current_click")},300),m&&(m.style.zIndex="99"),s&&(s.style.zIndex="99"),g&&(g.style.zIndex="99")}})},I;r&&p&&(this.settings.trigger==="hover"?window.innerWidth<=767?h():(i.addEventListener("mouseover",()=>{if(e(p),p.classList.add("ecom-hotspot-actived"),$<768){var C=window.pageYOffset;window.document.addEventListener("scroll",function(){var z=window.pageYOffset;(C-z>100||z-C>100)&&(p.classList.remove("ecom-hotspot-actived"),document.removeEventListener("click",v),_(p))})}i.getAttribute("data-source")==="product"&&c&&l(i),m&&(m.style.zIndex="99"),s&&(s.style.zIndex="99"),g&&(g.style.zIndex="99")}),i.addEventListener("mouseleave",function(){_(p),p.classList.remove("ecom-hotspot-actived"),m&&(m.style.zIndex="unset"),s&&(s.style.zIndex="unset"),g&&(g.style.zIndex="unset")})):h())}function k(){n.querySelector(".element__image-hotspot--content.ecom-hotspot-actived:not(.ecom_current_click)")&&n.querySelector(".element__image-hotspot--content.ecom-hotspot-actived:not(.ecom_current_click)").classList.remove("ecom-hotspot-actived"),_(p),document.removeEventListener("click",v)}function v(h){(h===void 0||!h.target.closest(".ecom-hotspots-container-tooltip"))&&k()}});function e(i){let a=i.closest(".ecom-column.ecom-core"),r=i.closest(".ecom-row.ecom-core");a&&(a.style.zIndex=101),r&&(r.style.zIndex=101)}function _(i){let a=i.closest(".ecom-column.ecom-core"),r=i.closest(".ecom-row.ecom-core");a&&(a.style.zIndex=""),r&&(r.style.zIndex="")}

                    });
                    
                        document.querySelectorAll('.ecom-ebscykjokko').forEach(function(el){
                            Func.call({$el: el, id: 'ecom-ebscykjokko', settings: {"trigger":"hover"},isLive: true});
                        });
                    
                        document.querySelectorAll('.ecom-48hlj08tx3h').forEach(function(el){
                            Func.call({$el: el, id: 'ecom-48hlj08tx3h', settings: {"trigger":"hover"},isLive: true});
                        });
                    

                })();
            
                if(window.location.search.indexOf("ecom-token=") < 0)
                {
                    document.querySelector(".ecom-builder").innerHTML = '<h3 style="width:100%;display:block;text-align:center">This template for preview purposes only</h3>';
                    document.querySelector("body").style.opacity= "0.7";
                }
            ;window.addEventListener("load",()=>{
                let isAdmin = false;
                if(document.querySelector("#admin-bar-iframe")){
                    isAdmin = true;
                }
                if(!isAdmin) {
                    if(window.EComposerBrand) {
                        return;
                    } else {
                        window.EComposerBrand = true;
                    }
                }
                let a=document.querySelector("body"),b=document.createElement(Math.random().toString(36).replace(/\d*/g,"").substr(2,4));b.setAttribute("style",["position:relative","top: 0px","left: 0px","display: inline-block","height: 30px","line-height: 30px","font-size: 11px","width: 100%","text-align: center","opacity: 1","text-indent: 0","color: rgba(18, 18, 18, 0.75)","background: transparent","opacity: 0.8",""].join(" !important;")),b.innerHTML="Built with <a style='color: currentColor;text-decoration: none;' href=\"https://ecomposer.io/?utm_source=client-site&utm_medium=footer&utm_campaign=footer_branding&utm_term=links&utm_content="+window.location.origin+"\" target=\"_blank\">EComposer</a>" + (isAdmin ? ". Contact us or upgrade to remove branding" :""),a.appendChild(b)
            });