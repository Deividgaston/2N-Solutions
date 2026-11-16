/**
 * 2N · Configurador de equipos y mediciones (encargo 0132, boceto W-03 v20).
 *
 * Sin IA: todo son reglas. Este fichero lleva dos capas:
 *  - NÚCLEO (puro, sin DOM): reglas por vertical y nivel, mediciones por partidas, coste
 *    orientativo a PVP, Excel (xlsx escrito a mano, sin librerías) y mensaje del lead.
 *    Se carga también desde Node para las pruebas (js/tests/0132.test.cjs).
 *  - INTERFAZ (solo navegador): los 4 pasos de configurador.html, el formulario y el lead.
 *
 * Las reglas, referencias y cifras vienen del boceto (docs/W03_configurador_reglas_v10.md,
 * con los cambios v11 a v20) y NO se han modificado al portarlas. Precios: PVP de la tarifa
 * 2N de nexo-v3 a 10/09/2026 (tabla PR). Sin cableado ni mano de obra, sin 2 hilos.
 */
(function (root, factory) {
    'use strict';
    var core = factory();
    if (typeof module === 'object' && module.exports) module.exports = core;
    else root.Configurador = core;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { core.ui(); });
        else core.ui();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Nombre visible de cada vertical (el boceto lo leía de su tabla V). */
    var VN = { bts: 'Residencial BTS', btr: 'Residencial BTR', ofi: 'Oficinas', hot: 'Hoteles', ret: 'Retail', seg: 'Seguridad crítica' };
    var VK = { bts: 'Residencial · Venta', btr: 'Residencial · Alquiler', ofi: 'Corporativo', hot: 'Hospitality', ret: 'Comercial', seg: 'Seguridad' };
    var ICON = { bts: 'fa-building', btr: 'fa-key', ofi: 'fa-briefcase', hot: 'fa-hotel', ret: 'fa-store', seg: 'fa-shield-halved' };
    var ORDER = ['bts', 'btr', 'ofi', 'hot', 'ret', 'seg'];

    /* ───────────── REGLAS Y MEDICIONES (verbatim del boceto) ───────────── */
  var CZ={
   bts:{nums:[['viv','Viviendas',40,1,999],['por','Portales o entradas a pie',2,1,50],['com','Zonas comunes con puerta propia',2,0,30]],togs:[['gar','Tiene garaje',true],['con','Tiene conserjería',false]],
     lv:['Se entra con el móvil, una tarjeta o un código. Monitor sencillo en casa.','Pantalla con directorio en la entrada y monitor con pantalla en casa. Lo más habitual.','Placa de cristal con pantalla de 10″, monitor táctil de 7″ y acabados en negro.']},
   btr:{nums:[['viv','Viviendas',60,1,999],['por','Portales o entradas a pie',1,1,50],['com','Zonas comunes con puerta propia',3,0,30]],togs:[['gar','Tiene garaje',true],['con','Tiene conserjería o atención remota',true],['smk','Cerradura inteligente en cada vivienda (smartlock)',false]],
     lv:['Llave digital en el móvil y monitor sencillo en casa.','Pantalla con directorio en la entrada y monitor con pantalla en casa.','Placa de cristal con pantalla de 10″, monitor táctil de 7″ y acabados en negro.']},
   ofi:{nums:[['pla','Plantas con oficinas',4,1,60],['cal','Otras entradas desde la calle',1,0,30],['com','Zonas compartidas (comedor, gimnasio, salas)',2,0,30],['ser','Salas técnicas o de servidores',1,0,30],['des','Despachos con cerradura inteligente',0,0,300],['ref','Zonas de refugio',0,0,30]],togs:[['gar','Tiene garaje',true],['rec','Tiene recepción',true]],
     lv:['Entradas, garaje, salas técnicas y recepción.','Además, cada planta y las zonas compartidas, con placa de cristal de 10″ en la entrada.','Lo anterior con acabados en negro y relés de seguridad.']},
   hot:{ln:['Básico','Estándar','Premium'],nums:[['hab','Habitaciones',40,0,999],['com','Zonas comunes de huéspedes (spa, gimnasio…)',2,0,30],['per','Puertas de personal',3,0,50],['car','Puertas de carga',1,0,20],['ref','Zonas de refugio',0,0,30]],togs:[['ent','Tiene entrada principal con videoportero',true],['des','Hotel sin recepción (desatendido)',false],['rec','Tiene recepción',true],['par','Tiene parking',false]],
     lv:['Videoportero 2N IP One en la entrada principal.','Videoportero 2N IP Verso 2.0 con control de accesos en la entrada principal.','Placa 2N IP Style con pantalla táctil de 10″ en la entrada principal.']},
   ret:{nums:[['tie','Tiendas',1,1,500],['per','Entradas de personal por tienda',1,1,10],['tra','Almacenes o cuartos protegidos por tienda',2,0,10],['uni','Puntos de llamada sencillos por tienda (IP Uni)',1,0,10]],togs:[['mue','Tiene muelle de carga',true]],
     lv:['Muelle y entrada de personal por tienda.','Además, almacén y cuartos protegidos, y todas las tiendas desde un sitio.','Lo anterior con llamada y vídeo también en la entrada de personal.']},
   seg:{nums:[['per','Accesos al perímetro',2,1,100],['sos','Puntos de ayuda (SOS)',2,0,100],['res','Zonas restringidas',4,0,200]],togs:[['cen','Tiene centro de control',true]],
     lv:['Perímetro y zonas restringidas.','Además, puntos SOS y atención desde el centro de control.','Lo anterior con tarjetas de alta seguridad y lectores cifrados (OSDP).']}
  };
  var LVN=['Esencial','Recomendado','Premium'];function LN(t){t=t||cz.t;return (t&&CZ[t].ln)||LVN;}
  var cz={t:null,v:{},lv:1};
  var D={'9155211C':'Unidad principal 2N IP Verso 2.0 con cámara, acabado níquel','9155211CB':'Unidad principal 2N IP Verso 2.0 con cámara, acabado negro','9155036':'Módulo de pantalla táctil para directorio','91550945':'Módulo lector Bluetooth y RFID','91550947':'Módulo de teclado táctil con lector Bluetooth y RFID','9155012':'Marco de empotrar de 2 módulos','9155013':'Marco de empotrar de 3 módulos','9155011':'Marco de empotrar de 1 módulo','9155012B':'Marco de empotrar de 2 módulos, negro','9155013B':'Marco de empotrar de 3 módulos, negro','9155011B':'Marco de empotrar de 1 módulo, negro','9155014':'Caja de empotrar de 1 módulo','9155015':'Caja de empotrar de 2 módulos','9155016':'Caja de empotrar de 3 módulos','9157101':'2N IP Style · placa con pantalla táctil de 10″','9157001':'Caja de empotrar del IP Style','9160347':'2N Access Unit 2.0 · teclado táctil, Bluetooth y RFID','9160345':'2N Access Unit 2.0 · Bluetooth y RFID','9160347-S':'2N Access Unit 2.0 · teclado táctil, Bluetooth y RFID, tarjetas seguras','91550371':'Módulo OSDP','9159010':'Relé de seguridad','9138511':'2N Clip · monitor de 4,3″','91378501':'2N Indoor Compact · monitor de 4,3″','91378601':'2N Indoor View · monitor táctil de 7″','91378800':'Caja de empotrar para monitor','9158106':'2N IP One · videoportero con cámara, negro','9158001':'Caja de empotrar del IP One','1120102':'2N IP Phone D7A · puesto de respuesta','1120105':'Cámara USB para D7A (vídeo en los dos sentidos)','91379601':'Licencia 2N PICard Commander','11202601':'Tarjetas MIFARE DESFire EV3 4K (pack de 10)','1120120E':'2N Access Commander Box 2.0','91379031':'Licencia Access Commander Advanced','91379032':'Licencia Access Commander Pro','91379033':'Licencia Access Commander Unlimited','9161151':'2N Access Unit M · Bluetooth y RFID','916121':'Caja de empotrar Access Unit M','9137424E':'Lector USB de tarjetas RFID 125 kHz y 13,56 MHz seguro, con NFC, para dar de alta tarjetas','9151301C':'2N IP Force 2.0 · 1 botón, cámara','9151302CR':'2N IP Force 2.0 · 2 botones, cámara, preparado para lector','9151325':'Lector RFID con OSDP para IP Force 2.0','9151325-S':'Lector RFID con OSDP, compatible Seos, para IP Force 2.0','9151001':'Caja de empotrar IP Force 2.0','9152101MW':'2N IP Safety · botón de emergencia rojo','9153101P':'2N IP Uni · 1 botón con pictogramas','9153101':'2N IP Uni · 1 botón, con caja de empotrar incluida','916201':'2N Access Unit QR','1120411':'2N Fortis Cylinder · pomo electrónico','1120421':'2N Fortis Cylinder · pomo mecánico','FORTIS-CIL':'2N Fortis Cylinder · cuerpo del cilindro de perfil europeo','FORTIS-HAN':'2N Fortis Handle · manilla inalámbrica con lector RFID y credencial móvil'};
  function marcos(n){if(n===4)return[2,2];var m=[];for(var i=0;i<Math.floor(n/3);i++)m.push(3);if(n%3)m.push(n%3);return m;}
  function modular(main,mods,q){var L=[[main,q]];mods.forEach(function(m){L.push([m,q]);});marcos(Math.max(main==='916201'?2:1,1+mods.length)).forEach(function(n){L.push([({1:'9155011',2:'9155012',3:'9155013'})[n],q]);L.push([({1:'9155014',2:'9155015',3:'9155016'})[n],q]);});return L;}
  function verso(mods,negro,q){var L=[[negro?'9155211CB':'9155211C',q]];mods.forEach(function(m){L.push([m,q]);});
    marcos(1+mods.length).forEach(function(n){L.push([({1:'9155011',2:'9155012',3:'9155013'})[n]+(negro?'B':''),q]);L.push([({1:'9155014',2:'9155015',3:'9155016'})[n],q]);});return L;}
  function au2(q,negro,ref,extra){var L=[[ref||'9160347',q]];(extra||[]).forEach(function(m){L.push([m,q]);});var nm=1+(extra||[]).length;L.push([(negro?{1:'9155011B',2:'9155012B',3:'9155013B'}:{1:'9155011',2:'9155012',3:'9155013'})[nm],q]);L.push([{1:'9155014',2:'9155015',3:'9155016'}[nm],q]);return L;}
  function acLic(dev,usr){if(dev<=5&&usr<=50)return null;if(dev<=30&&usr<=300)return'91379031';if(dev<=100&&usr<=1000)return'91379032';return'91379033';}
  function build(){var t=cz.t,v=cz.v,lv=cz.lv,Z=[],A=[],dev=0,ext=0;
    function zone(n,part,u,why,L,isDev,isExt){if(!u||!L.length)return;Z.push({n:n,part:part,u:u,why:why,L:L.filter(function(x){return x[1]>0;})});dev+=isDev||0;ext+=isExt||0;}
    var neg=lv===2;
      function acZone(nz,part,usr,why){var l=acLic(dev,usr),packs=Math.ceil(usr/10);zone(nz,part,1,why+' Tarjetas dimensionadas para '+(packs*10)+' usuarios.',[['1120120E',1]].concat(l?[[l,1]]:[]).concat([['91379601',1],['9137424E',1],['11202601',packs]]));}
    function placa(q,teclado){return lv===2||(lv===1&&!teclado)?[['9157101',q],['9157001',q]]:verso(lv===1?['9155036','91550945']:['91550947'],false,q);}
    function placaTxt(){return lv===0?'IP Verso 2.0 con teclado':(lv===1?'IP Verso 2.0 con pantalla':'IP Style');}
    if(t==='bts'||t==='btr'){
      var portal=lv===2?[['9157101',v.por],['9157001',v.por]]:verso(lv===1?['9155036','91550945']:['91550947'],false,v.por);
      zone('Portales','Placa de calle de portal',v.por,'llamada de visitas con videocomunicación al monitor de la vivienda y al móvil del residente, y acceso de residentes con credencial móvil Bluetooth, tarjeta RFID o código, según los módulos instalados.',portal,v.por,v.por);
      if(v.gar){zone('Garaje','Control de acceso a la entrada del garaje',1,v.con?'llamada con vídeo a conserjería y apertura de la puerta de garaje con credencial móvil o tarjeta, en sustitución de los mandos a distancia.':'apertura de la puerta de garaje con credencial móvil Bluetooth o tarjeta RFID, en sustitución de los mandos a distancia.',v.con?verso(['91550945'],neg,1):au2(1,neg),1,1);
        zone('Garaje','Control de acceso a la salida del garaje',1,'apertura de la puerta de garaje en salida con la misma credencial del residente.',au2(1,neg),1,1);}
      if(v.com)zone('Zonas comunes','Control de acceso a zona común',v.com,'acceso restringido a residentes autorizados y por franjas horarias, con registro de eventos.',au2(v.com,neg),v.com,v.com);
      var ind=lv===0?[['9138511',v.viv]]:[[lv===1?'91378501':'91378601',v.viv],['91378800',v.viv]];
      zone('Viviendas','Monitor de videoportero en vivienda',v.viv,'videocomunicación con la placa de calle y apertura de puerta desde la vivienda; la llamada se desvía también al móvil del residente con la app My2N.',ind);
      if(t==='btr'&&v.smk){zone('Viviendas','Cerradura inteligente en la puerta de la vivienda',v.viv,'cerradura electrónica inalámbrica para la puerta de la vivienda, sin cableado; la credencial del inquilino se asigna y se revoca en remoto desde la plataforma de gestión.',[['1120411',v.viv],['1120421',v.viv],['FORTIS-CIL',v.viv]],v.viv);A.push('El cuerpo del cilindro Fortis (perfil europeo, medidas A/B) depende del grosor de cada puerta: se define con el proyecto.');}
      if(v.con)zone('Conserjería',t==='btr'?'Puesto de conserjería o atención':'Puesto de conserjería',1,'atención de las llamadas con vídeo de las placas y apertura de los accesos desde el puesto.',[['1120102',1]].concat(lv===2?[['1120105',1]]:[]));
      if(lv>0&&ext)zone('Seguridad','Relé de seguridad',ext,'se instala en la zona protegida, uno por cada puerta a calle o a zona común, e impide la apertura de la cerradura aunque se manipule o arranque el equipo exterior.',[['9159010',ext]]);
      if(t==='btr'){acZone('Gestión','Servidor de gestión de accesos',v.viv*2,'gestión centralizada de credenciales de inquilinos, proveedores y visitas, con altas y bajas en remoto.');}
      else A.push('La gestión va con My2N, la plataforma en la nube de 2N: con monitor en la vivienda, la llamada a la app del móvil va incluida.');
    }
    if(t==='ofi'){var au='9160345';
      zone('Entrada principal','Placa de calle de la entrada principal',1,'directorio de empresas, videollamada a recepción o a la empresa visitada y acceso de empleados con credencial móvil, tarjeta o código.',lv===0?verso(['91550947'],false,1):[['9157101',1],['9157001',1]],1,1);
      if(v.cal)zone('Otras entradas','Control de acceso en entrada desde la calle',v.cal,'acceso de empleados desde la calle con credencial móvil Bluetooth o tarjeta RFID, con registro de eventos.',au2(v.cal,neg,au),v.cal,v.cal);
      if(v.rec)zone('Recepción','Puesto de recepción',1,'videocomunicación con las placas y apertura remota de los accesos desde recepción.',[['1120102',1]].concat(lv>0?[['1120105',1]]:[]));
      if(v.gar){zone('Garaje','Control de acceso al garaje (entrada y salida)',2,'lectores de entrada y salida del garaje que utilizan la misma credencial que el acceso a la oficina.',au2(2,neg,au),2,2);}
      if(lv>0){zone('Plantas','Control de acceso a planta',v.pla,'acceso de cada empresa únicamente a su planta, según los permisos y horarios definidos en la plataforma de gestión.',au2(v.pla,neg,au),v.pla);
        if(v.com)zone('Zonas compartidas','Control de acceso a zona compartida',v.com,'acceso a comedor, gimnasio o salas para los usuarios autorizados, con registro de eventos.',au2(v.com,neg,au),v.com);}
      if(v.ser)zone('Salas técnicas','Control de acceso a sala técnica o de servidores',v.ser,'acceso restringido al personal autorizado, con registro de cada apertura.',au2(v.ser,neg,au),v.ser);
      if(v.des){zone('Despachos','Manilla inteligente en despacho',v.des,'manilla electrónica inalámbrica que se instala en la puerta existente sin cableado ni obra.',[['FORTIS-HAN',v.des]],v.des);A.push('Las manillas Fortis Handle se piden según la mano y el grosor de cada puerta: se define con el proyecto.');}
      if(v.ref)zone('Zonas de refugio','Intercomunicador de zona de refugio',v.ref,'comunicación bidireccional con recepción para las personas que esperan asistencia en la zona de refugio; botón con pictogramas.',[['9153101P',v.ref]],v.ref);
      if(lv>0&&ext)zone('Seguridad','Relé de seguridad',ext,'se instala en la zona protegida, uno por cada puerta a calle, e impide la apertura de la cerradura aunque se manipule o arranque el equipo exterior.',[['9159010',ext]]);
      acZone('Gestión','Servidor de gestión de accesos',v.pla*40,'gestión centralizada de empleados, empresas, horarios y visitas.');
    }
    if(t==='hot'){var qr=function(q){return modular('916201',['91550947'],q);},au='9160345';
      if(v.ent)zone('Entrada principal','Placa de calle de la entrada del hotel',1,v.des?'llamada con vídeo al servicio de atención remota y acceso del huésped con el código de su reserva.':'llamada con vídeo a recepción'+(lv>0?' y acceso del huésped con su código o su tarjeta.':' y apertura del acceso desde recepción.'),lv===0?[['9158106',1],['9158001',1]]:(lv===1?verso(['91550947'],false,1):[['9157101',1],['9157001',1]]),1,1);
      if(v.des)zone('Recepción','Puesto de atención remota',1,'atención con vídeo de la entrada desde fuera del hotel y apertura remota del acceso.',[['1120102',1],['1120105',1]]);
      else if(v.rec)zone('Recepción','Puesto de recepción',1,'videocomunicación con las placas y apertura de los accesos desde recepción.',[['1120102',1],['1120105',1]]);
      if(v.hab)zone('Habitaciones',v.des?'Lector de código QR en puerta de habitación':'Manilla inteligente en puerta de habitación',v.hab,v.des?'apertura de la habitación con el código QR de la reserva, sin necesidad de recepción ni de tarjetas.':'cerradura electrónica inalámbrica sin cableado; recepción asigna y revoca la credencial de cada huésped desde la plataforma de gestión.',v.des?qr(v.hab):[['FORTIS-HAN',v.hab]],v.hab);
      if(v.hab&&!v.des){A.push('Las manillas Fortis Handle se piden según la mano y el grosor de cada puerta: se define con el proyecto.');}
      if(v.com)zone('Zonas de huéspedes',v.des?'Lector de código QR en zona de huéspedes':'Control de acceso a zona de huéspedes',v.com,'acceso a spa, gimnasio u otras zonas de huéspedes con la misma credencial de la habitación.',v.des?qr(v.com):au2(v.com,false,au),v.com);
      if(v.per)zone('Zonas de personal','Control de acceso a zona de personal',v.per,'acceso a cocina, almacén o lavandería restringido al personal autorizado y por turnos.',au2(v.per,false,au),v.per);
      if(v.car)zone('Puertas de carga','Placa de llamada en puerta de carga',v.car,'placa antivandálica para la llamada con vídeo del proveedor y apertura desde recepción o en remoto.',[['9151301C',v.car],['9151001',v.car]],v.car);
      if(v.par){zone('Parking','Control de acceso a la entrada del parking',1,'acceso del huésped al parking con la misma credencial de su estancia.',v.des?qr(1):au2(1,false,au),1);zone('Parking','Control de acceso a la salida del parking',1,'apertura en salida del parking con la misma credencial.',au2(1,false,au),1);}
      if(v.ref)zone('Zonas de refugio','Intercomunicador de zona de refugio',v.ref,'comunicación bidireccional con recepción o con el centro de atención remota para las personas que esperan asistencia en la zona de refugio; botón con pictogramas.',[['9153101P',v.ref]],v.ref);
      if(lv===2&&v.ent)zone('Seguridad','Relé de seguridad',1,'se instala en la zona protegida de la puerta a calle e impide la apertura de la cerradura aunque se manipule o arranque el equipo exterior.',[['9159010',1]]);
      acZone('Gestión','Servidor de gestión de accesos',v.hab*3,'gestión centralizada de credenciales de huéspedes y personal, integrable por API con el sistema de reservas.');
    }
    if(t==='ret'){var n=v.tie;
      if(v.mue)zone('Muelle de carga','Placa de llamada en muelle de carga',n,'placa antivandálica para la llamada con vídeo del transportista y apertura desde la tienda o en remoto.',[['9151301C',n],['9151001',n]],n);
      zone('Personal','Control de acceso en entrada de personal',n*v.per,'acceso de empleados con credencial móvil o tarjeta, con permisos por turno.',lv===2?verso(['91550945'],false,n*v.per):au2(n*v.per,false,'9160345'),n*v.per);
      if(v.uni)zone('Puntos de llamada','Intercomunicador de llamada sencillo',n*v.uni,'punto de llamada de audio de un botón para puertas de servicio, almacén o zonas de clientes, atendido desde la tienda o desde la central.',[['9153101',n*v.uni]],n*v.uni);
      if(lv>0&&v.tra)zone('Almacén','Control de acceso a almacén o cuarto protegido',n*v.tra,'acceso restringido al personal autorizado, con registro de cada apertura.',au2(n*v.tra,false,'9160345'),n*v.tra);
      if(lv>0){acZone('Gestión','Servidor de gestión de accesos de la cadena',n*15,'gestión centralizada de los accesos de todas las tiendas.');}
      else A.push('La gestión de cada tienda va con My2N, la plataforma en la nube de 2N.');
    }
    if(t==='seg'){
      zone('Perímetro','Placa de acceso perimetral para exterior',v.per,'placa antivandálica de exterior con cámara y lector de tarjetas para el control del acceso perimetral.',[['9151302CR',v.per],[lv===2?'9151325-S':'9151325',v.per],['9151001',v.per]],v.per);
      if(lv>0&&v.sos)zone('Puntos SOS','Punto de ayuda SOS',v.sos,'punto de llamada de emergencia que comunica en manos libres con el centro de control.',[['9152101MW',v.sos]],v.sos);
      if(v.res)zone('Zonas restringidas','Control de acceso a zona restringida',v.res,'lector con teclado que permite doble factor (tarjeta y código) y registro de cada acceso'+(lv===2?'; el módulo OSDP lo comunica con el sistema de seguridad.':'.'),au2(v.res,false,lv===2?'9160347-S':'9160347',lv===2?['91550371']:[]),v.res);
      if(lv>0&&v.cen)zone('Centro de control','Puesto del centro de control',1,'atención de las llamadas con vídeo y apertura remota de los accesos desde el centro de control.',[['1120102',1],['1120105',1]]);
      acZone('Gestión','Servidor de gestión de accesos',v.res*20+50,'gestión centralizada de usuarios, permisos y registros de acceso.');
    }
    A.push('Los equipos se alimentan por PoE: hace falta un switch PoE, que no está incluido.');
    Z.forEach(function(z){z.desc=partida(z);});
    return {Z:Z,A:A};}
  var SPEC={"9155211C": "videoportero IP con protocolo SIP; cámara Full HD (1920 x 1080) con ángulo de visión de 138° en horizontal, luz infrarroja y WDR; audio full dúplex con cancelación de eco y amplificador de 5 W; marco de fundición de zinc; protección IP54 e IK08; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V CC; vídeo compatible con ONVIF perfil S", "9155036": "módulo de pantalla táctil del sistema modular 2N IP Verso 2.0, con directorio de residentes y llamada por nombre", "91550945": "lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128 y alcance ajustable (normalmente hasta 3 m en corto y 10 m en largo); lector RFID de 13,56 MHz que lee MIFARE DESFire EV2/EV3 con 2N PICard, y NFC", "91550947": "teclado táctil capacitivo que no da falsos toques con la superficie mojada; lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128 y lector RFID de 13,56 MHz que lee MIFARE DESFire EV2/EV3 con 2N PICard, y NFC", "9157101": "placa IP con protocolo SIP y pantalla táctil de 10,1″ (1280 x 800); cámara de hasta 2560 x 1920 con ángulo de 144° en horizontal, luz infrarroja y WDR; dos micrófonos y altavoz de 2 x 4 W (85 dB); directorio de hasta 10.000 usuarios; lector Bluetooth 5.0 LE compatible con WaveKey y RFID de 125 kHz y 13,56 MHz; frontal de vidrio templado; protección IP65 e IK08; funciona de -30 °C a +60 °C; alimentación PoE+ 802.3at o 12 V CC", "9158106": "videoportero IP de un botón retroiluminado; cámara de hasta 1920 x 1440 con ángulo de 156° en horizontal, luz infrarroja y WDR; procesador Axis ARTPEC-7; tapa frontal de aluminio fundido; protección IP66 e IK08; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V CC", "9160345": "lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128 y lector RFID de 13,56 MHz que lee MIFARE DESFire EV2/EV3 con 2N PICard, y NFC; relé NA/NC de 30 V 1 A; antisabotaje integrado; marco de fundición de zinc; protección IP54 e IK08; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V CC", "9160347": "teclado táctil capacitivo; lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128 y lector RFID de 13,56 MHz que lee MIFARE DESFire EV2/EV3 con 2N PICard, y NFC; relé NA/NC de 30 V 1 A; antisabotaje integrado; marco de fundición de zinc; protección IP54 e IK08; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V CC", "9160347-S": "versión segura: teclado táctil capacitivo; lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128 y lector RFID que añade HID SE (Seos, iClass SE, MIFARE SE); relé NA/NC de 30 V 1 A; antisabotaje integrado; marco de fundición de zinc; protección IP54 e IK08; alimentación PoE 802.3af o 12 V CC", "91378501": "monitor IP con pantalla de 4,3″ (480 x 272) y 7 botones capacitivos retroiluminados; altavoz de 2 W; salida para bucle de inducción; alimentación PoE 802.3af o 12 V CC", "91378601": "monitor IP con pantalla táctil capacitiva de 7″ (1024 x 600); altavoz de 2 W; salida para bucle de inducción; Wi-Fi opcional; hasta 3 comandos HTTP para domótica; alimentación PoE 802.3af o 12 V CC", "9138511": "monitor IP con pantalla de 4,3″ (480 x 272) y 3 botones capacitivos; altavoz de 2 W; alimentación PoE 802.3af", "1120102": "teléfono IP con protocolo SIP y pantalla táctil de 7″ (1024 x 600); vista previa y apertura de puerta con un botón; agenda de hasta 1.000 contactos; Wi-Fi; alimentación PoE 802.3af", "1120105": "cámara USB de 5 megapíxeles con obturador de privacidad, para videollamada en los dos sentidos", "9151301C": "1 botón de llamada; placa IP antivandálica con protocolo SIP; cámara de hasta 2560 x 1920 con ángulo de 133° en horizontal y 0,1 lux sin infrarrojos; dos micrófonos y altavoz de 10 W (94 dB) con índice de transmisión de voz de 0,89; audio full dúplex con cancelación de eco; cuerpo de aluminio; protección IP69 e IK10 en el cuerpo (IK08 en cámara y frontal); funciona de -30 °C a +55 °C; LAN 10/100/1000BASE-TX; alimentación PoE+ 802.3at o 12 V CC", "9151302CR": "2 botones de llamada y preparada para lector de tarjetas; placa IP antivandálica con protocolo SIP; cámara de hasta 2560 x 1920 con ángulo de 133° en horizontal y 0,1 lux sin infrarrojos; dos micrófonos y altavoz de 10 W (94 dB) con índice de transmisión de voz de 0,89; audio full dúplex con cancelación de eco; cuerpo de aluminio; protección IP69 e IK10 en el cuerpo (IK08 en cámara y frontal); funciona de -30 °C a +55 °C; LAN 10/100/1000BASE-TX; alimentación PoE+ 802.3at o 12 V CC", "9153101": "intercomunicador IP con protocolo SIP y un botón retroiluminado con etiqueta sustituible; audio full dúplex con cancelación de eco; acero inoxidable; protección IP54 e IK10; funciona de -40 °C a +55 °C; alimentación PoE 802.3af o 12 V CC", "9153101P": "intercomunicador IP con protocolo SIP y botón con pictogramas; audio full dúplex con cancelación de eco; acero inoxidable; protección IP54 e IK10; funciona de -40 °C a +55 °C; alimentación PoE 802.3af o 12 V CC", "9159010": "relé de seguridad que se instala en la zona protegida; contactos NA/NC hasta 30 V 1 A", "1120411": "cilindro electrónico inalámbrico de perfil europeo, sin cableado y apto para reforma; lector RFID de 13,56 MHz (MIFARE DESFire), NFC y Bluetooth LE; cifrado AES-128 con autenticación segura; latón niquelado; protección IP55; alimentación por 2 pilas CR2 de 3 V con hasta 80.000 aperturas (unos 2 años de uso típico); funciona de +5 °C a +55 °C; gestión desde 2N Access Commander", "FORTIS-HAN": "manilla electrónica inalámbrica de interior, sin cableado ni obra, con lector, electrónica y alimentación integrados; lector RFID de 13,56 MHz (MIFARE DESFire), NFC y Bluetooth LE; cifrado AES-128 con autenticación segura; roseta redonda de 55 mm y manilla en L de 140 mm; para puertas de madera, acero o aluminio de 30 a 110 mm; alimentación por 1 pila CR123A de 3 V con hasta 230.000 aperturas (unos 4 años de uso típico); funciona de +5 °C a +55 °C", "1120120E": "miniordenador sin ventilador con el software 2N Access Commander preinstalado, sin necesidad de servidor propio; procesador Intel N100 de 3,40 GHz, 16 GB de RAM DDR4 y disco SSD NVMe de 250 GB; LAN de 2,5 Gbit; admite hasta 7.000 dispositivos y 200.000 usuarios; incluye licencia básica para 5 dispositivos; gestiona usuarios, credenciales, grupos, permisos, horarios y registros de acceso, con API REST para integración con terceros; funciona de 0 °C a +50 °C; dimensiones 57,6 x 127,5 x 132 mm", "916201": "lector de control de acceso por código QR con controlador integrado y el mismo diseño de 2 módulos del 2N IP Verso 2.0; lee códigos QR estáticos (versiones 1 a 40); cámara de 1920 x 1440 con ángulo de 125° en horizontal, luz infrarroja y WDR, que se integra como cámara en el sistema de vídeo (ONVIF perfil S y T); LAN 10/100/1000BASE-TX; entrada pasiva o activa, salida activa de 8 a 12 V CC y relé NA/NC de 30 V 1 A; admite todos los módulos del 2N IP Verso 2.0; protección IP54 e IK08; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V 1 A CC", "91379601": "licencia 2N PICard Commander para codificar y gestionar tarjetas MIFARE DESFire EV2/EV3 protegidas con 2N PICard", "11202601": "tarjetas sin contacto MIFARE DESFire EV3 de 4 KB a 13,56 MHz, protegidas con la tecnología 2N PICard en los lectores 2N; pack de 10 unidades", "9137424E": "lector USB de sobremesa de tarjetas RFID de 125 kHz y 13,56 MHz con NFC, para dar de alta las tarjetas desde el puesto de gestión", "9152101MW": "intercomunicador IP de emergencia con protocolo SIP 2.0 y botón rojo de emergencia; dos micrófonos integrados, amplificador de clase D de 10 W y altavoz de 10 W con presión sonora de 94 dB a 1 m; audio full dúplex con cancelación de eco, volumen adaptativo y prueba automática del lazo de audio; códecs G.711, G.729 y G.722; salida de relé NA/NC de 30 V 1 A y salida activa de 9 a 13 V CC; cuerpo de aluminio fundido antivandálico; protección IP69K e IK10; funciona de -40 °C a +55 °C; alimentación PoE 802.3af o 12 V 2 A CC; dimensiones 217 x 109 x 83 mm; montaje en superficie sin accesorios adicionales", "91379031": "licencia 2N Access Commander Advanced para hasta 30 dispositivos, 300 usuarios y 5 administradores", "91379032": "licencia 2N Access Commander Pro para hasta 100 dispositivos y 1.000 usuarios, con administradores ilimitados", "91379033": "licencia 2N Access Commander Unlimited, sin límite de dispositivos ni usuarios dentro de la capacidad del software", "9161151": "lector de control de acceso de formato estrecho para marco de puerta, con controlador integrado; lector Bluetooth 5.0 LE con cifrado RSA-1024 y AES-128, lector RFID que lee MIFARE DESFire EV2/EV3 con 2N PICard, y NFC; relé NA/NC de 30 V 1 A, 2 entradas y antisabotaje integrado; frontal de vidrio templado; protección IP55 e IK07; funciona de -40 °C a +60 °C; alimentación PoE 802.3af o 12 V 1 A CC por un único cable; dimensiones 50 x 133 x 27 mm", "9151325": "lector RFID multifrecuencia de 125 kHz y 13,56 MHz con interfaz OSDP, montado dentro de la placa; lee MIFARE DESFire EV2/EV3 protegidas con 2N PICard y NFC", "9151325-S": "lector RFID multifrecuencia de 125 kHz y 13,56 MHz con interfaz OSDP, compatible con HID SE (Seos, iClass SE, MIFARE SE), montado dentro de la placa", "91550371": "módulo OSDP para comunicar el lector con un controlador o sistema de seguridad externo mediante protocolo OSDP", "9151001": "caja de empotrar para obra de ladrillo de 131 x 222 x 82 mm", "9158001": "caja de empotrar de 67 x 167 x 56 mm", "9155011": "marco de empotrar de 1 módulo (130 x 153 x 5 mm) en fundición de zinc", "9155012": "marco de empotrar de 2 módulos (130 x 257 x 5 mm) en fundición de zinc", "9155013": "marco de empotrar de 3 módulos (130 x 361 x 5 mm) en fundición de zinc", "9155014": "caja de empotrar de 1 módulo para hueco de obra de 108 x 131 x 45 mm", "9155015": "caja de empotrar de 2 módulos para hueco de obra de 108 x 238 x 45 mm", "9155016": "caja de empotrar de 3 módulos para hueco de obra de 108 x 343 x 45 mm"};
  Object.keys(D).forEach(function(k){D[k]=D[k].replace(/\b2N(?![®\w])/g,'2N®');});SPEC['9155211CB']=SPEC['9155211C'];SPEC['9160345-S']=SPEC['9160345'];['1','2','3'].forEach(function(n){SPEC['915501'+n+'B']=SPEC['915501'+n].replace('zinc','zinc, acabado negro');});
  function partida(z){var comp=z.L.map(function(x){var q=x[1]/z.u,nm=D[x[0]].replace(/ · /g,', ');return (Number.isInteger(q)&&q>1?q+' x ':'')+nm.charAt(0).toLowerCase()+nm.slice(1);});
    var sp=[];z.L.forEach(function(x){if(SPEC[x[0]]&&sp.indexOf(SPEC[x[0]])<0)sp.push(SPEC[x[0]]);});
    var r='Ud. '+z.part+', marca 2N®. Suministro de conjunto compuesto por: '+comp.join('; ')+'. '+(sp.length?'Características técnicas: '+sp.map(function(t){return t.charAt(0).toUpperCase()+t.slice(1);}).join('. ')+'. ':'')+'Función: '+z.why;
    return r.replace(/\b2N(?![®\w])/g,'2N®');}

    /* ───────────── COSTE ORIENTATIVO A PVP ───────────── */
    /* PR: PVP de la tarifa 2N (nexo-v3, 10/09/2026). RED: estimación por puerto PoE, NO es producto 2N. MY2N10: 9137954, 10 años. */
  var PR={"9155211C": 1359.0, "9155211CB": 1359.0, "9155036": 953.0, "91550945": 639.0, "91550947": 766.0, "9155012": 89.0, "9155013": 97.0, "9155011": 80.0, "9155012B": 89.0, "9155013B": 97.0, "9155011B": 80.0, "9155014": 27.0, "9155015": 34.0, "9155016": 39.0, "9157101": 3817.0, "9157001": 179.0, "9160347": 977.0, "9160345": 856.0, "9160347-S": 1148.0, "91550371": 163.0, "9159010": 91.0, "9138511": 321.0, "91378501": 493.0, "91378601": 631.0, "91378800": 26.0, "9158106": 964.0, "9158001": 39.0, "1120102": 496.0, "1120105": 129.0, "91379601": 812.0, "11202601": 65.0, "1120120E": 1249.0, "91379031": 669.0, "91379032": 1450.0, "91379033": 3343.0, "9161151": 679.0, "916121": 33.0, "9137424E": 481.0, "9151301C": 1708.0, "9151302CR": 1720.0, "9151325": 280.0, "9151325-S": 324.0, "9151001": 94.0, "9152101MW": 1136.0, "9153101P": 500.0, "9153101": 431.0, "916201": 642.0, "1120411": 466.0, "1120421": 20.0, "FORTIS-HAN": 585.0, "FORTIS-CIL": 67.0},RED=20,MY2N10=225;
  var NOPORT=/^(91550|9155011|9155012|9155013|9155014|9155015|9155016|9157001|9158001|9151001|91378800|1120105|91379|11202601|9137424E|9159010|1120421|FORTIS|9151325)/;
  function eur(n){return Math.round(n/10)*10;}
  function fmt(n){return eur(n).toLocaleString('es-ES')+' €';}

    /* Dos columnas en residencial (con monitor / solo app); una sola en el resto. Nada de cableado ni mano de obra. */
    function calc(r, app) {
        var eq = 0, ports = 0, falta = [], viv = 0;
        r.Z.forEach(function (z) {
            var mon = z.part === 'Monitor de videoportero en vivienda';
            if (mon) viv = z.u;
            if (app && mon) return;
            z.L.forEach(function (x) {
                var p = PR[x[0]];
                if (p == null) { if (falta.indexOf(x[0]) < 0) falta.push(x[0]); } else eq += p * x[1];
                if (!NOPORT.test(x[0])) ports += x[1];
            });
        });
        return { eq: eq, red: ports * RED, ports: ports, lic: app ? viv * MY2N10 : 0, falta: falta, viv: viv };
    }
    function coste(r, t, v) {
        var res = t === 'bts' || t === 'btr';
        var A = calc(r, false), B = res ? calc(r, true) : null;
        function tot(c) { return c.eq + c.red + c.lic; }
        var div = res ? A.viv : (t === 'hot' ? v.hab : 0);
        var falta = A.falta.concat(B ? B.falta : []).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return { A: A, B: B, totA: tot(A), totB: B ? tot(B) : null, div: div, ud: res ? 'vivienda' : 'habitación', falta: falta,
            fortis: r.Z.some(function (z) { return z.L.some(function (x) { return x[0] === 'FORTIS-CIL'; }); }) };
    }

    /* ───────────── EXCEL SIN LIBRERÍAS (xlsx = zip de XML, sin compresión) ───────────── */
  function xesc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'&#10;');}
  function sheetXml(rows,widths){var cols='<cols>'+widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+cols+'<sheetData>'+rows.map(function(r,i){return '<row r="'+(i+1)+'">'+r.c.map(function(v,j){var ref=String.fromCharCode(65+j)+(i+1),s=r.s?' s="'+r.s+'"':'';return typeof v==='number'?'<c r="'+ref+'"'+s+'><v>'+v+'</v></c>':(v===''?'':'<c r="'+ref+'" t="inlineStr"'+s+'><is><t xml:space="preserve">'+xesc(v)+'</t></is></c>');}).join('')+'</row>';}).join('')+'</sheetData></worksheet>';}
  var CRC=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function zipBytes(files){var enc=new TextEncoder(),parts=[],cen=[],off=0;
    function u16(v){return [v&255,(v>>8)&255];}function u32(v){return [v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];}
    files.forEach(function(f){var name=enc.encode(f[0]),data=enc.encode(f[1]),crc=crc32(data);
      var h=[].concat([0x50,0x4b,3,4],u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0));
      parts.push(new Uint8Array(h),name,data);
      cen.push(new Uint8Array([].concat([0x50,0x4b,1,2],u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),name);
      off+=h.length+name.length+data.length;});
    var cs=cen.reduce(function(a,b){return a+b.length;},0);
    var end=new Uint8Array([].concat([0x50,0x4b,5,6],u16(0),u16(0),u16(files.length),u16(files.length),u32(cs),u32(off),u16(0)));
    var all=parts.concat(cen,[end]),n=all.reduce(function(a,b){return a+b.length;},0),out=new Uint8Array(n),p=0;all.forEach(function(b){out.set(b,p);p+=b.length;});return out;}
    var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    var XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

    /* Devuelve los bytes del .xlsx con dos hojas: «Mediciones» y «Desglose por referencia». */
    function xlsxBytes(r, t, v, lv, fecha) {
        var tit = 'Mediciones 2N · ' + VN[t] + ' · Nivel ' + LN(t)[lv];
        var datos = CZ[t].nums.map(function (f) { return v[f[0]] + ' ' + f[1].toLowerCase(); }).join(' · ');
        var head = [{ c: [tit], s: 1 }, { c: [datos] }, { c: ['Orientativo y sin precios. Fecha: ' + fecha + '. Un prescriptor de 2N España lo ajusta a tu proyecto.'] }, { c: [''] }];
        var r1 = head.concat([{ c: ['Código', 'Referencia', 'Descripción', 'Ud.', 'Cantidad'], s: 2 }]), agg = {}, ord = [], cap = null, ci = 0, pi = 0;
        r.Z.forEach(function (z) {
            if (z.n !== cap) { cap = z.n; ci++; pi = 0; r1.push({ c: [('0' + ci).slice(-2), '', z.n.toUpperCase(), '', ''], s: 4 }); }
            pi++;
            r1.push({ c: [('0' + ci).slice(-2) + '.' + ('0' + pi).slice(-2), '', z.part.toUpperCase(), 'ud.', z.u], s: 1 });
            z.L.forEach(function (x) {
                r1.push({ c: ['', x[0].indexOf('FORTIS') === 0 ? 'Según puerta' : x[0], D[x[0]].replace(/ · /g, ', '), 'ud.', x[1]] });
                if (!agg[x[0]]) { agg[x[0]] = 0; ord.push(x[0]); }
                agg[x[0]] += x[1];
            });
            r1.push({ c: ['', '', z.desc, '', ''], s: 3 }); r1.push({ c: [''] });
        });
        r1.push({ c: [''] }, { c: ['A tener en cuenta'], s: 1 });
        r.A.forEach(function (a) { r1.push({ c: [a] }); });
        var r2 = head.concat([{ c: ['Referencia', 'Descripción', 'Cantidad total'], s: 2 }]);
        ord.forEach(function (k) { r2.push({ c: [k.indexOf('FORTIS') === 0 ? 'Según puerta' : k, D[k], agg[k]] }); });
        var styles = XML + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0088EF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0088EF"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
        return zipBytes([
            ['[Content_Types].xml', XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
            ['_rels/.rels', XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
            ['xl/workbook.xml', XML + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Mediciones" sheetId="1" r:id="rId1"/><sheet name="Desglose por referencia" sheetId="2" r:id="rId2"/></sheets></workbook>'],
            ['xl/_rels/workbook.xml.rels', XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
            ['xl/styles.xml', styles], ['xl/worksheets/sheet1.xml', sheetXml(r1, [9, 14, 95, 6, 10])], ['xl/worksheets/sheet2.xml', sheetXml(r2, [14, 60, 14])]]);
    }

    /* ───────────── LEAD (web_leads) ───────────── */
    var LEAD_MAX = 2000;
    function resumenLead(t, v, lv, r, c) {
        var datos = CZ[t].nums.map(function (f) { return v[f[0]] + ' ' + f[1].toLowerCase(); }).join(', ');
        var tg = CZ[t].togs.filter(function (g) { return v[g[0]]; }).map(function (g) { return g[1].toLowerCase(); });
        var refs = {}, uds = 0;
        r.Z.forEach(function (z) { z.L.forEach(function (x) { refs[x[0]] = 1; uds += x[1]; }); });
        var s = 'Configurador · ' + VN[t] + ' · nivel ' + LN(t)[lv] + '. Cantidades: ' + datos + '.' +
            (tg.length ? ' Incluye: ' + tg.join(', ') + '.' : '') +
            ' Total: ' + Object.keys(refs).length + ' referencias, ' + uds + ' unidades.' +
            ' Coste orientativo a PVP: ' + fmt(c.totA) + (c.totB != null ? ' con monitor, ' + fmt(c.totB) + ' solo app' : '') + '.';
        return s.length > LEAD_MAX ? s.slice(0, LEAD_MAX - 1) + '…' : s;
    }
    /* Mismos campos y valores que ya acepta web_leads con el formulario de la portada (js/home.js). Ninguno más. */
    var PTYPE = { bts: 'bts', btr: 'btr', ofi: 'office', hot: 'hotel', ret: 'retail', seg: 'security' }; // códigos del select de la portada
    function leadFields(contact, t, v, lv, r, c) {
        var f = {
            name: { stringValue: contact.name },
            email: { stringValue: contact.email },
            projectType: { stringValue: PTYPE[t] },
            message: { stringValue: resumenLead(t, v, lv, r, c) },
            source: { stringValue: 'configurador' },
            createdAt: { timestampValue: new Date().toISOString() }
        };
        if (contact.company) f.company = { stringValue: contact.company };
        return f;
    }

    /* Atajo para las pruebas y para el uso desde la página: construye con un estado dado. */
    function compute(t, v, lv) {
        cz.t = t; cz.v = v; cz.lv = lv;
        var r = build();
        return { r: r, c: coste(r, t, v) };
    }
    function defaults(t) {
        var c = CZ[t], v = {};
        c.nums.concat(c.extra || []).forEach(function (f) { v[f[0]] = f[2]; });
        c.togs.forEach(function (g) { v[g[0]] = g[2]; });
        return v;
    }

    /* Una zona de la lista del paso 4 (encargo 0133). En ≤ 600 px la descripción de partida
       se pliega con un botón aria-expanded; el Excel lleva siempre la descripción completa. */
    function zonaHtml(z, ci, pi, idx) {
        var did = 'czd' + idx;
        return '<article class="cz-zone"><div class="cz-pt"><span class="cz-u">' + z.u + '<small>ud.</small></span><div><span class="cz-code">' + ('0' + ci).slice(-2) + '.' + ('0' + pi).slice(-2) + '</span><b>' + z.part + '</b></div></div><ul class="cz-dg">' +
            z.L.map(function (x) { return '<li><span class="r">' + (x[0].indexOf('FORTIS') === 0 ? 'según puerta' : x[0]) + '</span><span class="d">' + D[x[0]].replace(/ · /g, ', ') + '</span><span class="qq">' + x[1] + '</span></li>'; }).join('') +
            '</ul><button class="cz-tg" type="button" aria-expanded="false" aria-controls="' + did + '">Ver descripción de partida</button><p class="cz-desc" id="' + did + '">' + z.desc + '</p></article>';
    }

    var api = {
        CZ: CZ, D: D, PR: PR, SPEC: SPEC, VN: VN, VK: VK, ICON: ICON, ORDER: ORDER, RED: RED, MY2N10: MY2N10,
        LN: LN, defaults: defaults, compute: compute, coste: coste, eur: eur, fmt: fmt, resumenLead: resumenLead,
        leadFields: leadFields, xlsxBytes: xlsxBytes, zipBytes: zipBytes, crc32: crc32, MIME_XLSX: MIME_XLSX, LEAD_MAX: LEAD_MAX,
        _state: cz, zonaHtml: zonaHtml
    };

    /* ───────────── INTERFAZ ───────────── */
    var FS_BASE = 'https://firestore.googleapis.com/v1/projects/crm-obras-prod/databases/(default)/documents';
    var API_KEY = 'AIzaSyBdTl2XXdo9ks-qqhBqDdXk8uLb65qyD-I'; // la misma clave pública de js/firebase-init.js y js/home.js

    function ui() {
        var root = document.getElementById('configurador');
        if (!root) return;
        function $(id) { return document.getElementById(id); }
        var last = null, lastCost = null;

        function czStep(s, ns) {
            [1, 2, 3, 4].forEach(function (i) { $('cz' + i).hidden = i !== s; });
            document.querySelectorAll('#czsteps li').forEach(function (li) {
                var n = +li.dataset.s; li.className = n === s ? 'on' : (n < s ? 'done' : '');
            });
            if (s === 4) czPaint();
            if (s > 1 && !ns) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        function czNums() {
            var c = CZ[cz.t], all = c.nums.concat(cz.lv === 2 && c.extra ? c.extra : []);
            $('cznums').innerHTML = all.map(function (f) {
                return '<label class="cz-num"><span>' + f[1] + '</span><span class="cz-step"><button type="button" data-d="-1" data-k="' + f[0] + '" aria-label="Menos">−</button><input type="number" inputmode="numeric" min="' + f[3] + '" max="' + f[4] + '" value="' + cz.v[f[0]] + '" data-k="' + f[0] + '"><button type="button" data-d="1" data-k="' + f[0] + '" aria-label="Más">+</button></span></label>';
            }).join('');
            $('cztogs').innerHTML = c.togs.map(function (g) {
                return '<label class="cz-sw"><input type="checkbox" data-k="' + g[0] + '"' + (cz.v[g[0]] ? ' checked' : '') + '><span class="tr"></span>' + g[1] + '</label>';
            }).join('');
        }
        function czLevels() {
            $('czlevels').innerHTML = LN().map(function (n, i) {
                return '<button class="cz-lv" type="button" data-lv="' + i + '" aria-pressed="' + (i === cz.lv) + '">' + (i === 1 ? '<span class="tagr">Lo más habitual</span>' : '') + '<b>' + n + '</b><span>' + CZ[cz.t].lv[i] + '</span></button>';
            }).join('');
        }
        function czPick(k, go) {
            cz.t = k; cz.v = defaults(k); cz.lv = 1;
            document.querySelectorAll('.cz-type').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.t === k)); });
            czNums(); czLevels(); if (go) czStep(2);
        }
        function colHtml(t, c, tot, cs) {
            var div = cs.div;
            return '<div class="col"><b>' + t + '</b><div class="big">' + fmt(tot) + '</div>' + (div ? '<span>' + fmt(tot / div) + ' por ' + cs.ud + '</span>' : '') +
                '<dl><dt>Equipos 2N (PVP)</dt><dd>' + fmt(c.eq) + '</dd><dt>Electrónica de red estimada (' + c.ports + ' puertos PoE)</dt><dd>' + fmt(c.red) + '</dd>' +
                (c.lic ? '<dt>Suscripción My2N 10 años por vivienda</dt><dd>' + fmt(c.lic) + '</dd>' : '') + '</dl></div>';
        }
        function czCoste(cs) {
            var B = cs.B;
            $('czcoste').innerHTML = '<section class="cz-cost"><h4>Coste orientativo a PVP</h4><p class="nota">PVP de tarifa 2N, sin IVA, sin cableado ni mano de obra. La electrónica de red es una estimación a ' + RED + ' € por puerto PoE. El precio final lo da el instalador.</p><div class="cols">' +
                colHtml(B ? 'Con monitor en cada vivienda' : 'Material y red', cs.A, cs.totA, cs) +
                (B ? colHtml('Solo app en el móvil, sin monitor (10 años de My2N incluidos)', B, cs.totB, cs) : '') + '</div>' +
                (cs.fortis ? '<p class="nota">El cilindro Fortis se calcula con perfil europeo 30/30; varía con el grosor de la puerta.</p>' : '') +
                (cs.falta.length ? '<p class="nota">Sin precio en tarifa, no incluidos: ' + cs.falta.join(', ') + '.</p>' : '') + '</section>';
        }
        function czPaint() {
            var o = compute(cz.t, cz.v, cz.lv), r = o.r, tot = 0, refs = {};
            $('czsum').innerHTML = '<span><b>' + VN[cz.t] + '</b></span>' + CZ[cz.t].nums.map(function (f) { return '<span>' + cz.v[f[0]] + ' · ' + f[1].toLowerCase() + '</span>'; }).join('') +
                '<span>Nivel <b>' + LN()[cz.lv] + '</b></span><span class="cz-lvsw">' + LN().map(function (n, i) { return '<button type="button" data-lv="' + i + '" aria-pressed="' + (i === cz.lv) + '">' + n + '</button>'; }).join('') +
                '</span><button class="lnk" type="button" data-cz="2">Cambiar datos</button>';
            var cap = null, ci = 0, pi = 0, idx = 0;
            r.Z.forEach(function (z) { z.L.forEach(function (x) { tot += x[1]; refs[x[0]] = 1; }); });
            $('czzones').innerHTML = r.Z.map(function (z) {
                var h = '';
                if (z.n !== cap) { cap = z.n; ci++; pi = 0; h = '<h4 class="cz-cap">' + ('0' + ci).slice(-2) + ' · ' + z.n + '</h4>'; }
                pi++;
                return h + zonaHtml(z, ci, pi, idx++);
            }).join('') + '<div class="cz-notes"><b>A tener en cuenta</b><ul>' + r.A.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>';
            $('cztot').innerHTML = '<b>' + Object.keys(refs).length + '</b> referencias · <b>' + tot + '</b> unidades';
            last = r; lastCost = o.c; czCoste(o.c);
            $('f').style.display = ''; $('ok').classList.remove('on'); $('ferr').textContent = '';
        }

        function descargar() {
            var d = new Date(), t = cz.t, lv = cz.lv;
            var bytes = api.xlsxBytes(last, t, cz.v, lv, d.toLocaleDateString('es-ES'));
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([bytes], { type: MIME_XLSX }));
            a.download = 'Mediciones 2N - ' + VN[t] + ' - ' + LN()[lv] + '.xlsx';
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        }
        function enviarLead(contact) {
            return fetch(FS_BASE + '/web_leads?key=' + API_KEY, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: leadFields(contact, cz.t, cz.v, cz.lv, last, lastCost) })
            }).then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); });
        }
        function err(id, el, msg) { $(id).textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
        function emailMsg(m) { return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(m) ? '' : (m.indexOf('@') < 0 ? 'Falta la @ en el email.' : 'Revisa el email.'); }

        root.addEventListener('click', function (e) {
            var b;
            if ((b = e.target.closest('.cz-tg'))) {
                var ab = b.getAttribute('aria-expanded') === 'true';
                b.setAttribute('aria-expanded', String(!ab)); b.closest('.cz-zone').classList.toggle('open', !ab);
                b.textContent = ab ? 'Ver descripción de partida' : 'Ocultar descripción de partida'; return;
            }
            if ((b = e.target.closest('.cz-type'))) { czPick(b.dataset.t, true); return; }
            if ((b = e.target.closest('[data-cz]'))) { var s = +b.dataset.cz; if (s > 1 && !cz.t) s = 1; czStep(s); return; }
            if ((b = e.target.closest('[data-lv]'))) { cz.lv = +b.dataset.lv; czLevels(); czNums(); if (!$('cz4').hidden) czPaint(); return; }
            if ((b = e.target.closest('.cz-step button'))) {
                var k = b.dataset.k, inp = $('cznums').querySelector('input[data-k="' + k + '"]'),
                    nv = Math.max(+inp.min, Math.min(+inp.max, (+inp.value || 0) + (+b.dataset.d)));
                inp.value = nv; cz.v[k] = nv; return;
            }
            if (e.target.id === 'again') { descargar(); return; }
            if (e.target.closest('#cznew')) {
                cz.t = null; cz.v = {}; cz.lv = 1; last = null; lastCost = null;
                document.querySelectorAll('.cz-type').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
                var f = $('f'); f.reset(); f.style.display = ''; $('ok').classList.remove('on');
                ['e-name', 'e-email', 'ferr'].forEach(function (i) { $(i).textContent = ''; });
                czStep(1, true); root.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        root.addEventListener('input', function (e) {
            var k = e.target.dataset && e.target.dataset.k; if (!k) return;
            if (e.target.type === 'checkbox') cz.v[k] = e.target.checked;
            else { var n = parseInt(e.target.value, 10); if (!isNaN(n)) cz.v[k] = Math.max(+e.target.min, Math.min(+e.target.max, n)); }
        });
        $('opts').innerHTML = ORDER.map(function (k) {
            return '<button class="cz-type" type="button" data-t="' + k + '" aria-pressed="false"><i class="fa-solid ' + ICON[k] + '" aria-hidden="true"></i><span><b>' + VN[k] + '</b><small>' + VK[k] + '</small></span></button>';
        }).join('');
        czStep(1, true);

        $('f').addEventListener('submit', function (ev) {
            ev.preventDefault();
            var f = this, btn = f.querySelector('button[type="submit"]');
            var name = f.elements.name.value.trim(), email = f.elements.email.value.trim(), company = f.elements.company.value.trim();
            var a = err('e-name', f.elements.name, name ? '' : 'Escribe tu nombre.'), b = err('e-email', f.elements.email, emailMsg(email));
            if (!(a && b) || !last) return;
            btn.disabled = true;
            $('ferr').textContent = '';
            descargar(); // la descarga no depende de que el lead llegue
            enviarLead({ name: name, email: email, company: company })
                .then(function () { f.style.display = 'none'; $('ok').classList.add('on'); })
                .catch(function (e2) {
                    console.error('Configurador: no se pudo guardar el lead', e2);
                    f.style.display = 'none'; $('ok').classList.add('on');
                    $('ferr').textContent = 'El Excel se ha descargado, pero no hemos podido avisar al equipo. Escríbenos a gaston@2n.com.';
                })
                .then(function () { btn.disabled = false; });
        });
    }

    api.ui = ui;
    return api;
});
