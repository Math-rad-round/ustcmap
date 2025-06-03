// Garden Gnome Software - Skin
// Pano2VR 6.1.8/17956
// Filename: testinfo.ggsk
// Generated 2025-06-03T20:36:45

function pano2vrSkin(player,base) {
	var me=this;
	var skin=this;
	var flag=false;
	var hotspotTemplates={};
	var skinKeyPressed = 0;
	this.player=player;
	this.player.skinObj=this;
	this.divSkin=player.divSkin;
	this.ggUserdata=player.userdata;
	this.lastSize={ w: -1,h: -1 };
	var basePath="";
	// auto detect base path
	if (base=='?') {
		var scripts = document.getElementsByTagName('script');
		for(var i=0;i<scripts.length;i++) {
			var src=scripts[i].src;
			if (src.indexOf('skin.js')>=0) {
				var p=src.lastIndexOf('/');
				if (p>=0) {
					basePath=src.substr(0,p+1);
				}
			}
		}
	} else
	if (base) {
		basePath=base;
	}
	this.elementMouseDown=[];
	this.elementMouseOver=[];
	var cssPrefix='';
	var domTransition='transition';
	var domTransform='transform';
	var prefixes='Webkit,Moz,O,ms,Ms'.split(',');
	var i;
	var hs,el,els,elo,ela,elHorScrollFg,elHorScrollBg,elVertScrollFg,elVertScrollBg,elCornerBg;
	if (typeof document.body.style['transform'] == 'undefined') {
		for(var i=0;i<prefixes.length;i++) {
			if (typeof document.body.style[prefixes[i] + 'Transform'] !== 'undefined') {
				cssPrefix='-' + prefixes[i].toLowerCase() + '-';
				domTransition=prefixes[i] + 'Transition';
				domTransform=prefixes[i] + 'Transform';
			}
		}
	}
	
	player.setMargins(0,0,0,0);
	
	this.updateSize=function(startElement) {
		var stack=[];
		stack.push(startElement);
		while(stack.length>0) {
			var e=stack.pop();
			if (e.ggUpdatePosition) {
				e.ggUpdatePosition();
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
	}
	
	this.callNodeChange=function(startElement) {
		var stack=[];
		stack.push(startElement);
		while(stack.length>0) {
			var e=stack.pop();
			if (e.ggNodeChange) {
				e.ggNodeChange();
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
	}
	player.addListener('changenode', function() { me.ggUserdata=player.userdata; me.callNodeChange(me.divSkin); });
	
	var parameterToTransform=function(p) {
		var hs='translate(' + p.rx + 'px,' + p.ry + 'px) rotate(' + p.a + 'deg) scale(' + p.sx + ',' + p.sy + ')';
		return hs;
	}
	
	this.findElements=function(id,regex) {
		var r=[];
		var stack=[];
		var pat=new RegExp(id,'');
		stack.push(me.divSkin);
		while(stack.length>0) {
			var e=stack.pop();
			if (regex) {
				if (pat.test(e.ggId)) r.push(e);
			} else {
				if (e.ggId==id) r.push(e);
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
		return r;
	}
	
	this.addSkin=function() {
		var hs='';
		this.ggCurrentTime=new Date().getTime();
		player.addListener('sizechanged', function() {
			me.updateSize(me.divSkin);
		});
	};
	this.hotspotProxyClick=function(id, url) {
	}
	this.hotspotProxyDoubleClick=function(id, url) {
	}
	me.hotspotProxyOver=function(id, url) {
	}
	me.hotspotProxyOut=function(id, url) {
	}
	me.callChildLogicBlocksHotspot_skip2_mouseover = function(){
		if(hotspotTemplates['skip2']) {
			var i;
			for(i = 0; i < hotspotTemplates['skip2'].length; i++) {
				if (hotspotTemplates['skip2'][i]._skip2.logicBlock_visible) {
					hotspotTemplates['skip2'][i]._skip2.logicBlock_visible();
				}
				if (hotspotTemplates['skip2'][i]._text_10 && hotspotTemplates['skip2'][i]._text_10.logicBlock_visible) {
					hotspotTemplates['skip2'][i]._text_10.logicBlock_visible();
				}
			}
		}
	}
	me.callChildLogicBlocksHotspot_skip2_mousedown = function(){
		if(hotspotTemplates['skip2']) {
			var i;
			for(i = 0; i < hotspotTemplates['skip2'].length; i++) {
				if (hotspotTemplates['skip2'][i]._skip2.logicBlock_visible) {
					hotspotTemplates['skip2'][i]._skip2.logicBlock_visible();
				}
			}
		}
	}
	me.callChildLogicBlocksHotspot_skip2_mouseover = function(){
		if(hotspotTemplates['skip2']) {
			var i;
			for(i = 0; i < hotspotTemplates['skip2'].length; i++) {
				if (hotspotTemplates['skip2'][i]._text_10 && hotspotTemplates['skip2'][i]._text_10.logicBlock_visible) {
					hotspotTemplates['skip2'][i]._text_10.logicBlock_visible();
				}
			}
		}
	}
	player.addListener('changenode', function() {
		me.ggUserdata=player.userdata;
	});
	me.skinTimerEvent=function() {
		me.ggCurrentTime=new Date().getTime();
	};
	player.addListener('timer', me.skinTimerEvent);
	function SkinHotspotClass_skip(parentScope,hotspot) {
		var me=this;
		var flag=false;
		var hs='';
		me.parentScope=parentScope;
		me.hotspot=hotspot;
		var nodeId=String(hotspot.url);
		nodeId=(nodeId.charAt(0)=='{')?nodeId.substr(1, nodeId.length - 2):''; // }
		me.ggUserdata=skin.player.getNodeUserdata(nodeId);
		me.elementMouseDown=[];
		me.elementMouseOver=[];
		me.findElements=function(id,regex) {
			return skin.findElements(id,regex);
		}
		el=me._skip=document.createElement('div');
		el.ggId="skip";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_hotspot ";
		el.ggType='hotspot';
		hs ='';
		hs+='height : 0px;';
		hs+='left : 230px;';
		hs+='position : absolute;';
		hs+='top : 254px;';
		hs+='visibility : inherit;';
		hs+='width : 0px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._skip.ggIsActive=function() {
			return player.getCurrentNode()==this.ggElementNodeId();
		}
		el.ggElementNodeId=function() {
			if (me.hotspot.url!='' && me.hotspot.url.charAt(0)=='{') { // }
				return me.hotspot.url.substr(1, me.hotspot.url.length - 2);
			} else {
				if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
					return this.parentNode.ggElementNodeId();
				} else {
					return player.getCurrentNode();
				}
			}
		}
		me._skip.onclick=function (e) {
			player.openNext(me.hotspot.url,"");
			skin.hotspotProxyClick(me.hotspot.id, me.hotspot.url);
		}
		me._skip.ondblclick=function (e) {
			skin.hotspotProxyDoubleClick(me.hotspot.id, me.hotspot.url);
		}
		me._skip.onmouseover=function (e) {
			player.setActiveHotspot(me.hotspot);
			skin.hotspotProxyOver(me.hotspot.id, me.hotspot.url);
		}
		me._skip.onmouseout=function (e) {
			player.setActiveHotspot(null);
			skin.hotspotProxyOut(me.hotspot.id, me.hotspot.url);
		}
		me._skip.ggUpdatePosition=function (useTransition) {
		}
		el=me._text_12=document.createElement('div');
		els=me._text_12__text=document.createElement('div');
		el.className='ggskin ggskin_textdiv';
		el.ggTextDiv=els;
		el.ggId="Text 1";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_text ";
		el.ggType='text';
		hs ='';
		hs+='height : 72px;';
		hs+='left : -72px;';
		hs+='opacity : 0.5;';
		hs+='position : absolute;';
		hs+='top : -22px;';
		hs+='visibility : inherit;';
		hs+='width : 139px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		hs ='position:absolute;';
		hs += 'box-sizing: border-box;';
		hs+='cursor: default;';
		hs+='left: 0px;';
		hs+='top:  0px;';
		hs+='width: 139px;';
		hs+='height: auto;';
		hs+='background: #ffa26c;';
		hs+='border: 0px solid #000000;';
		hs+='color: rgba(55,0,118,1);';
		hs+='text-align: center;';
		hs+='white-space: pre-wrap;';
		hs+='padding: 0px 1px 0px 1px;';
		hs+='overflow: hidden;';
		hs+='overflow-y: auto;';
		els.setAttribute('style',hs);
		els.innerHTML=me.hotspot.title+""+me.hotspot.description;
		el.appendChild(els);
		me._text_12.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.ggNodeId;
		}
		me._text_12.ggUpdatePosition=function (useTransition) {
		}
		me._skip.appendChild(me._text_12);
		me.ggUse3d=true;
		me.gg3dDistance=500;
		me.__div = me._skip;
	};
	function SkinHotspotClass_hs1(parentScope,hotspot) {
		var me=this;
		var flag=false;
		var hs='';
		me.parentScope=parentScope;
		me.hotspot=hotspot;
		var nodeId=String(hotspot.url);
		nodeId=(nodeId.charAt(0)=='{')?nodeId.substr(1, nodeId.length - 2):''; // }
		me.ggUserdata=skin.player.getNodeUserdata(nodeId);
		me.elementMouseDown=[];
		me.elementMouseOver=[];
		me.findElements=function(id,regex) {
			return skin.findElements(id,regex);
		}
		el=me._hs1=document.createElement('div');
		el.ggId="hs1";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_hotspot ";
		el.ggType='hotspot';
		hs ='';
		hs+='height : 0px;';
		hs+='left : 253px;';
		hs+='position : absolute;';
		hs+='top : 85px;';
		hs+='visibility : inherit;';
		hs+='width : 0px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._hs1.ggIsActive=function() {
			return player.getCurrentNode()==this.ggElementNodeId();
		}
		el.ggElementNodeId=function() {
			if (me.hotspot.url!='' && me.hotspot.url.charAt(0)=='{') { // }
				return me.hotspot.url.substr(1, me.hotspot.url.length - 2);
			} else {
				if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
					return this.parentNode.ggElementNodeId();
				} else {
					return player.getCurrentNode();
				}
			}
		}
		me._hs1.onclick=function (e) {
			skin.hotspotProxyClick(me.hotspot.id, me.hotspot.url);
		}
		me._hs1.ondblclick=function (e) {
			skin.hotspotProxyDoubleClick(me.hotspot.id, me.hotspot.url);
		}
		me._hs1.onmouseover=function (e) {
			player.setActiveHotspot(me.hotspot);
			skin.hotspotProxyOver(me.hotspot.id, me.hotspot.url);
		}
		me._hs1.onmouseout=function (e) {
			player.setActiveHotspot(null);
			skin.hotspotProxyOut(me.hotspot.id, me.hotspot.url);
		}
		me._hs1.ggUpdatePosition=function (useTransition) {
		}
		el=me._text_11=document.createElement('div');
		els=me._text_11__text=document.createElement('div');
		el.className='ggskin ggskin_textdiv';
		el.ggTextDiv=els;
		el.ggId="Text 1";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_text ";
		el.ggType='text';
		hs ='';
		hs+='height : 41px;';
		hs+='left : -101px;';
		hs+='opacity : 0.5;';
		hs+='position : absolute;';
		hs+='top : 19px;';
		hs+='visibility : inherit;';
		hs+='width : 225px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		hs ='position:absolute;';
		hs += 'box-sizing: border-box;';
		hs+='cursor: default;';
		hs+='left: 0px;';
		hs+='top:  0px;';
		hs+='width: 225px;';
		hs+='height: auto;';
		hs+='background: #fffca1;';
		hs+='border: 0px solid #000000;';
		hs+='color: rgba(55,0,118,1);';
		hs+='text-align: center;';
		hs+='white-space: pre-wrap;';
		hs+='padding: 0px 1px 0px 1px;';
		hs+='overflow: hidden;';
		hs+='overflow-y: auto;';
		els.setAttribute('style',hs);
		els.innerHTML=me.hotspot.description;
		el.appendChild(els);
		me._text_11.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.ggNodeId;
		}
		me._text_11.ggUpdatePosition=function (useTransition) {
		}
		me._hs1.appendChild(me._text_11);
		me.__div = me._hs1;
	};
	function SkinHotspotClass_skip2(parentScope,hotspot) {
		var me=this;
		var flag=false;
		var hs='';
		me.parentScope=parentScope;
		me.hotspot=hotspot;
		var nodeId=String(hotspot.url);
		nodeId=(nodeId.charAt(0)=='{')?nodeId.substr(1, nodeId.length - 2):''; // }
		me.ggUserdata=skin.player.getNodeUserdata(nodeId);
		me.elementMouseDown=[];
		me.elementMouseOver=[];
		me.findElements=function(id,regex) {
			return skin.findElements(id,regex);
		}
		el=me._skip2=document.createElement('div');
		el.ggId="skip2";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_hotspot ";
		el.ggType='hotspot';
		hs ='';
		hs+='height : 0px;';
		hs+='left : 420px;';
		hs+='opacity : 0.2;';
		hs+='position : absolute;';
		hs+='top : 235px;';
		hs+='visibility : inherit;';
		hs+='width : 0px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._skip2.ggIsActive=function() {
			return player.getCurrentNode()==this.ggElementNodeId();
		}
		el.ggElementNodeId=function() {
			if (me.hotspot.url!='' && me.hotspot.url.charAt(0)=='{') { // }
				return me.hotspot.url.substr(1, me.hotspot.url.length - 2);
			} else {
				if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
					return this.parentNode.ggElementNodeId();
				} else {
					return player.getCurrentNode();
				}
			}
		}
		me._skip2.logicBlock_visible = function() {
			var newLogicStateVisible;
			if (
				((me.elementMouseOver['skip2'] == true)) || 
				((me.elementMouseDown['skip2'] == true))
			)
			{
				newLogicStateVisible = 0;
			}
			else {
				newLogicStateVisible = -1;
			}
			if (me._skip2.ggCurrentLogicStateVisible != newLogicStateVisible) {
				me._skip2.ggCurrentLogicStateVisible = newLogicStateVisible;
				me._skip2.style[domTransition]='';
				if (me._skip2.ggCurrentLogicStateVisible == 0) {
					me._skip2.style.visibility=(Number(me._skip2.style.opacity)>0||!me._skip2.style.opacity)?'inherit':'hidden';
					me._skip2.ggVisible=true;
				}
				else {
					me._skip2.style.visibility=(Number(me._skip2.style.opacity)>0||!me._skip2.style.opacity)?'inherit':'hidden';
					me._skip2.ggVisible=true;
				}
			}
		}
		me._skip2.onclick=function (e) {
			skin.hotspotProxyClick(me.hotspot.id, me.hotspot.url);
		}
		me._skip2.ondblclick=function (e) {
			skin.hotspotProxyDoubleClick(me.hotspot.id, me.hotspot.url);
		}
		me._skip2.onmouseover=function (e) {
			player.setActiveHotspot(me.hotspot);
			me.elementMouseOver['skip2']=true;
			me._text_10.logicBlock_visible();
			skin.hotspotProxyOver(me.hotspot.id, me.hotspot.url);
			me._skip2.logicBlock_visible();
		}
		me._skip2.onmouseout=function (e) {
			player.setActiveHotspot(null);
			me.elementMouseDown['skip2']=false;
			me.elementMouseOver['skip2']=false;
			me._text_10.logicBlock_visible();
			skin.hotspotProxyOut(me.hotspot.id, me.hotspot.url);
			me._skip2.logicBlock_visible();
			me._skip2.logicBlock_visible();
		}
		me._skip2.onmousedown=function (e) {
			me.elementMouseDown['skip2']=true;
			me._skip2.logicBlock_visible();
		}
		me._skip2.onmouseup=function (e) {
			me.elementMouseDown['skip2']=false;
			me._skip2.logicBlock_visible();
		}
		me._skip2.ontouchend=function (e) {
			me.elementMouseDown['skip2']=false;
			me.elementMouseOver['skip2']=false;
			me._text_10.logicBlock_visible();
			me._skip2.logicBlock_visible();
			me._skip2.logicBlock_visible();
		}
		me._skip2.ggUpdatePosition=function (useTransition) {
		}
		el=me._text_10=document.createElement('div');
		els=me._text_10__text=document.createElement('div');
		el.className='ggskin ggskin_textdiv';
		el.ggTextDiv=els;
		el.ggId="Text 1";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_text ";
		el.ggType='text';
		hs ='';
		hs+='height : 72px;';
		hs+='left : -35px;';
		hs+='opacity : 0.69999;';
		hs+='position : absolute;';
		hs+='top : -30px;';
		hs+='visibility : inherit;';
		hs+='width : 139px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		hs ='position:absolute;';
		hs += 'box-sizing: border-box;';
		hs+='cursor: default;';
		hs+='left: 0px;';
		hs+='top:  0px;';
		hs+='width: 139px;';
		hs+='height: auto;';
		hs+='background: #ffa26c;';
		hs+='border: 0px solid #000000;';
		hs+='color: rgba(55,0,118,1);';
		hs+='text-align: center;';
		hs+='white-space: pre-wrap;';
		hs+='padding: 0px 1px 0px 1px;';
		hs+='overflow: hidden;';
		hs+='overflow-y: auto;';
		els.setAttribute('style',hs);
		els.innerHTML=me.hotspot.title+""+me.hotspot.description;
		el.appendChild(els);
		me._text_10.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.ggNodeId;
		}
		me._text_10.logicBlock_visible = function() {
			var newLogicStateVisible;
			if (
				((me.elementMouseOver['text_10'] == true)) || 
				((me.elementMouseOver['skip2'] == true))
			)
			{
				newLogicStateVisible = 0;
			}
			else {
				newLogicStateVisible = -1;
			}
			if (me._text_10.ggCurrentLogicStateVisible != newLogicStateVisible) {
				me._text_10.ggCurrentLogicStateVisible = newLogicStateVisible;
				me._text_10.style[domTransition]='';
				if (me._text_10.ggCurrentLogicStateVisible == 0) {
					me._text_10.style.visibility=(Number(me._text_10.style.opacity)>0||!me._text_10.style.opacity)?'inherit':'hidden';
					me._text_10.ggVisible=true;
				}
				else {
					me._text_10.style.visibility=(Number(me._text_10.style.opacity)>0||!me._text_10.style.opacity)?'inherit':'hidden';
					me._text_10.ggVisible=true;
				}
			}
		}
		me._text_10.onmouseover=function (e) {
			me.elementMouseOver['text_10']=true;
			me._text_10.logicBlock_visible();
		}
		me._text_10.onmouseout=function (e) {
			if (e && e.toElement) {
				var current = e.toElement;
				while (current = current.parentNode) {
				if (current == me._text_10__text)
					return;
				}
			}
			me.elementMouseOver['text_10']=false;
			me._text_10.logicBlock_visible();
		}
		me._text_10.ontouchend=function (e) {
			me.elementMouseOver['text_10']=false;
			me._text_10.logicBlock_visible();
		}
		me._text_10.ggUpdatePosition=function (useTransition) {
		}
		me._skip2.appendChild(me._text_10);
		me.ggUse3d=true;
		me.gg3dDistance=500;
		me.__div = me._skip2;
	};
	function SkinHotspotClass_back(parentScope,hotspot) {
		var me=this;
		var flag=false;
		var hs='';
		me.parentScope=parentScope;
		me.hotspot=hotspot;
		var nodeId=String(hotspot.url);
		nodeId=(nodeId.charAt(0)=='{')?nodeId.substr(1, nodeId.length - 2):''; // }
		me.ggUserdata=skin.player.getNodeUserdata(nodeId);
		me.elementMouseDown=[];
		me.elementMouseOver=[];
		me.findElements=function(id,regex) {
			return skin.findElements(id,regex);
		}
		el=me._back=document.createElement('div');
		el.ggId="back";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_hotspot ";
		el.ggType='hotspot';
		hs ='';
		hs+='height : 0px;';
		hs+='left : 230px;';
		hs+='position : absolute;';
		hs+='top : 254px;';
		hs+='visibility : inherit;';
		hs+='width : 0px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._back.ggIsActive=function() {
			return player.getCurrentNode()==this.ggElementNodeId();
		}
		el.ggElementNodeId=function() {
			if (me.hotspot.url!='' && me.hotspot.url.charAt(0)=='{') { // }
				return me.hotspot.url.substr(1, me.hotspot.url.length - 2);
			} else {
				if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
					return this.parentNode.ggElementNodeId();
				} else {
					return player.getCurrentNode();
				}
			}
		}
		me._back.onclick=function (e) {
			player.goBack("");
			skin.hotspotProxyClick(me.hotspot.id, me.hotspot.url);
		}
		me._back.ondblclick=function (e) {
			skin.hotspotProxyDoubleClick(me.hotspot.id, me.hotspot.url);
		}
		me._back.onmouseover=function (e) {
			player.setActiveHotspot(me.hotspot);
			skin.hotspotProxyOver(me.hotspot.id, me.hotspot.url);
		}
		me._back.onmouseout=function (e) {
			player.setActiveHotspot(null);
			skin.hotspotProxyOut(me.hotspot.id, me.hotspot.url);
		}
		me._back.ggUpdatePosition=function (useTransition) {
		}
		el=me._text_1=document.createElement('div');
		els=me._text_1__text=document.createElement('div');
		el.className='ggskin ggskin_textdiv';
		el.ggTextDiv=els;
		el.ggId="Text 1";
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_text ";
		el.ggType='text';
		hs ='';
		hs+='height : 72px;';
		hs+='left : -72px;';
		hs+='opacity : 0.5;';
		hs+='position : absolute;';
		hs+='top : -22px;';
		hs+='visibility : inherit;';
		hs+='width : 139px;';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		hs ='position:absolute;';
		hs += 'box-sizing: border-box;';
		hs+='cursor: default;';
		hs+='left: 0px;';
		hs+='top:  0px;';
		hs+='width: 139px;';
		hs+='height: auto;';
		hs+='background: #ffa26c;';
		hs+='border: 0px solid #000000;';
		hs+='color: rgba(55,0,118,1);';
		hs+='text-align: center;';
		hs+='white-space: pre-wrap;';
		hs+='padding: 0px 1px 0px 1px;';
		hs+='overflow: hidden;';
		hs+='overflow-y: auto;';
		els.setAttribute('style',hs);
		els.innerHTML=me.hotspot.title+""+me.hotspot.description;
		el.appendChild(els);
		me._text_1.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.ggNodeId;
		}
		me._text_1.ggUpdatePosition=function (useTransition) {
		}
		me._back.appendChild(me._text_1);
		me.ggUse3d=true;
		me.gg3dDistance=500;
		me.__div = me._back;
	};
	me.addSkinHotspot=function(hotspot) {
		var hsinst = null;
		if (hotspot.skinid=='skip') {
			hotspot.skinid = 'skip';
			hsinst = new SkinHotspotClass_skip(me, hotspot);
			if (!hotspotTemplates.hasOwnProperty(hotspot.skinid)) {
				hotspotTemplates[hotspot.skinid] = [];
			}
			hotspotTemplates[hotspot.skinid].push(hsinst);
		} else
		if (hotspot.skinid=='hs1') {
			hotspot.skinid = 'hs1';
			hsinst = new SkinHotspotClass_hs1(me, hotspot);
			if (!hotspotTemplates.hasOwnProperty(hotspot.skinid)) {
				hotspotTemplates[hotspot.skinid] = [];
			}
			hotspotTemplates[hotspot.skinid].push(hsinst);
		} else
		if (hotspot.skinid=='skip2') {
			hotspot.skinid = 'skip2';
			hsinst = new SkinHotspotClass_skip2(me, hotspot);
			if (!hotspotTemplates.hasOwnProperty(hotspot.skinid)) {
				hotspotTemplates[hotspot.skinid] = [];
			}
			hotspotTemplates[hotspot.skinid].push(hsinst);
			me.callChildLogicBlocksHotspot_skip2_mouseover();;
			me.callChildLogicBlocksHotspot_skip2_mousedown();;
			me.callChildLogicBlocksHotspot_skip2_mouseover();;
		} else
		{
			hotspot.skinid = 'back';
			hsinst = new SkinHotspotClass_back(me, hotspot);
			if (!hotspotTemplates.hasOwnProperty(hotspot.skinid)) {
				hotspotTemplates[hotspot.skinid] = [];
			}
			hotspotTemplates[hotspot.skinid].push(hsinst);
		}
		return hsinst;
	}
	me.removeSkinHotspots=function() {
		if(hotspotTemplates['skip']) {
			var i;
			for(i = 0; i < hotspotTemplates['skip'].length; i++) {
				hotspotTemplates['skip'][i] = null;
			}
		}
		if(hotspotTemplates['hs1']) {
			var i;
			for(i = 0; i < hotspotTemplates['hs1'].length; i++) {
				hotspotTemplates['hs1'][i] = null;
			}
		}
		if(hotspotTemplates['skip2']) {
			var i;
			for(i = 0; i < hotspotTemplates['skip2'].length; i++) {
				hotspotTemplates['skip2'][i] = null;
			}
		}
		if(hotspotTemplates['back']) {
			var i;
			for(i = 0; i < hotspotTemplates['back'].length; i++) {
				hotspotTemplates['back'][i] = null;
			}
		}
		hotspotTemplates = [];
	}
	me.addSkin();
	var style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode('.ggskin { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 14px;}'));
	document.head.appendChild(style);
	player.addListener('mouseover', function(args) { me.callChildLogicBlocksHotspot_skip2_mouseover(); });
	player.addListener('mousedown', function(args) { me.callChildLogicBlocksHotspot_skip2_mousedown(); });
	player.addListener('mouseover', function(args) { me.callChildLogicBlocksHotspot_skip2_mouseover(); });
	player.addListener('hotspotsremoved', function(args) { me.removeSkinHotspots(); });
	me.skinTimerEvent();
};