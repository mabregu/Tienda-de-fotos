const path = require('path')
const fs = require('fs');

/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    inicioSesion: async(peticion, respuesta) => {
        respuesta.view('pages/admin/inicio_sesion')
    },

    procesarInicioSesion: async(peticion, respuesta) => {
        let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena })
        if (admin) {
            peticion.session.admin = admin
            peticion.session.cliente = undefined
            peticion.addFlash('mensaje', 'Sesión de admin iniciada')
            return respuesta.redirect("/admin/principal")
        } else {
            peticion.addFlash('mensaje', 'Email o contraseña invalidos')
            return respuesta.redirect("/admin/inicio-sesion");
        }
    },

    principal: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let fotos = await Foto.find().sort("id")
        respuesta.view('pages/admin/principal', { fotos })
    },

    cerrarSesion: async(peticion, respuesta) => {
        peticion.session.admin = undefined
        peticion.addFlash('mensaje', 'Sesión finalizada')
        return respuesta.redirect("/");
    },

    agregarFoto: async(peticion, respuesta) => {
        respuesta.view('pages/admin/agregar_foto')
    },

    procesarAgregarFoto: async(peticion, respuesta) => {
        let foto = await Foto.create({
            titulo: peticion.body.titulo,
            activa: true
        }).fetch()
        peticion.file('foto').upload({}, async(error, archivos) => {
            if (archivos && archivos[0]) {
                let upload_path = archivos[0].fd
                let ext = path.extname(upload_path)

                await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)))
                await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}` })
                peticion.addFlash('mensaje', 'Foto agregada')
                return respuesta.redirect("/admin/principal")
            }
            peticion.addFlash('mensaje', 'No hay foto seleccionada')
            return respuesta.redirect("/admin/agregar-foto")
        })
    },

    desactivarFoto: async(peticion, respuesta) => {
        await Foto.update({ id: peticion.params.fotoId }, { activa: false })
        peticion.addFlash('mensaje', 'Foto desactivada')
        return respuesta.redirect("/admin/principal")
    },

    activarFoto: async(peticion, respuesta) => {
        await Foto.update({ id: peticion.params.fotoId }, { activa: true })
        peticion.addFlash('mensaje', 'Foto activada')
        return respuesta.redirect("/admin/principal")
    },

    mostrarClientes: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let clientes = await Cliente.find({})
        respuesta.view('pages/admin/clientes', {
            clientes
        })
    },

    misOrdenes: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let clienteId = peticion.params.clienteId;
        //let ordenId = peticion.params.ordenId;
        let ordenes = await Orden.find({
            cliente: clienteId
        }).sort('id desc')
        respuesta.view('pages/admin/mis_ordenes', {
            ordenes
        })
    },

    ordenDeCompra: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }

        let ordenId = peticion.params.ordenId;

        let orden = await Orden.findOne({
            //cliente: peticion.session.cliente.id,
            id: ordenId
        }).populate('detalles')

        if (!orden) {
            return respuesta.redirect("pages/admin/clientes")
        }

        if (orden && orden.detalles == 0) {
            return respuesta.view('pages/admin/clientes', {
                orden
            })
        }

        orden.detalles = await OrdenDetalle.find({
            orden: orden.id
        }).populate('foto')
        return respuesta.view('pages/admin/orden', {
            orden
        })
    },

    desactivarCliente: async(peticion, respuesta) => {
        await Cliente.update({
            id: peticion.params.clienteId
        }, {
            activo: false
        })

        peticion.addFlash('mensaje', 'Cliente desactivado')
        return respuesta.redirect("/admin/clientes")
    },

    activarCliente: async(peticion, respuesta) => {
        await Cliente.update({
            id: peticion.params.clienteId
        }, {
            activo: true
        })
        peticion.addFlash('mensaje', 'Cliente activado')
        return respuesta.redirect("/admin/clientes")
    },

    mostrarAdministradores: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let administradores = await Admin.find({})

        respuesta.view('pages/admin/administradores', {
            administradores
        })
    },

    desactivarAdmin: async(peticion, respuesta) => {
        //console.log('Admin disabled', peticion.params.adminId)
        if (peticion.session.admin.id == peticion.params.adminId) {
            peticion.addFlash('mensaje', 'No puedes desactivarte a ti mismo!')
        } else {
            await Admin.update({
                id: peticion.params.adminId
            }, {
                activo: false
            })
            peticion.addFlash('mensaje', 'Administrador desactivado')
        }
        return respuesta.redirect("/admin/administradores")
    },

    activarAdmin: async(peticion, respuesta) => {
        await Admin.update({
            id: peticion.params.adminId
        }, {
            activo: true
        })
        peticion.addFlash('mensaje', 'Administrador activado')
        return respuesta.redirect("/admin/administradores")
    },

    /**
     * select count( * ) total_clientes from cliente
     select count( * ) total_fotos from foto
     select count( * ) total_administradores from admin
     select count( * ) total_ordenes from orden
     */
    dashboard: async(peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let consulta = `
          select 'clientes'
          as tipo, count( * ) total from cliente
          union
          select 'Fotos', count( * ) from foto
          union
          select 'Administradores', count( * ) from admin
          union
          select 'Ordenes', count( * ) from orden
        `
        await Cliente.getDatastore().sendNativeQuery(consulta, [], (errores, resultado) => {
            if (errores) return respuesta.serverError(errores);
            let total = resultado.rows

            respuesta.view("pages/admin/dashboard", {
                total
            })
        })
    }

};
