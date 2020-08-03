/**
 * CompraController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  agregarCarroCompra: async (peticion, respuesta) => {
    let foto = await CarroCompra.findOne({ foto: peticion.params.fotoId, cliente: peticion.session.cliente.id })
    if (foto) {
      peticion.addFlash('mensaje', 'La foto ya había sido agregada al carro de compra')
    }
    else {
      await CarroCompra.create({
        cliente: peticion.session.cliente.id,
        foto: peticion.params.fotoId
      })
      peticion.session.carroCompra = await CarroCompra.find({ cliente: peticion.session.cliente.id })
      peticion.addFlash('mensaje', 'Foto agregada al carro de compra')
    }
    return respuesta.redirect("/")
  },

  carroCompra: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.cliente) {
      return respuesta.redirect("/")
    }
    let elementos = await CarroCompra.find({ cliente: peticion.session.cliente.id }).populate('foto')
    respuesta.view('pages/carro_de_compra', { elementos })
  },

  eliminarCarroCompra: async (peticion, respuesta) => {
    let foto = await CarroCompra.findOne({ foto: peticion.params.fotoId, cliente: peticion.session.cliente.id })
    if (foto) {
      await CarroCompra.destroy({
        cliente: peticion.session.cliente.id,
        foto: peticion.params.fotoId
      })
      peticion.session.carroCompra = await CarroCompra.find({ cliente: peticion.session.cliente.id })
      peticion.addFlash('mensaje', 'Foto eliminada del carro de compra')
    }
    return respuesta.redirect("/carro-de-compra")
  },


  comprar: async (peticion, respuesta) => {
    let orden = await Orden.create({
      fecha: new Date(),
      cliente: peticion.session.cliente.id,
      total: peticion.session.carroCompra.length
    }).fetch()
    for (let i = 0; i < peticion.session.carroCompra.length; i++) {
      await OrdenDetalle.create({
        orden: orden.id,
        foto: peticion.session.carroCompra[i].foto
      })
    }
    await CarroCompra.destroy({ cliente: peticion.session.cliente.id })
    peticion.session.carroCompra = []
    peticion.addFlash('mensaje', 'La compra ha sido realizada')
    return respuesta.redirect("/")
  },

  misOrdenes: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.cliente) {
      return respuesta.redirect("/")
    }
    let ordenes = await Orden.find({ cliente: peticion.session.cliente.id }).sort('id desc')
    respuesta.view('pages/mis_ordenes', { ordenes })
  },

  ordenDeCompra: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.cliente) {
      return respuesta.redirect("/")
    }
    let orden = await Orden.findOne({ cliente: peticion.session.cliente.id, id: peticion.params.ordenId }).populate('detalles')

    if (!orden) {
      return respuesta.redirect("/mis-ordenes")
    }

    if (orden && orden.detalles == 0) {
      return respuesta.view('pages/orden', { orden })
    }

    orden.detalles = await OrdenDetalle.find({ orden: orden.id }).populate('foto')
    return respuesta.view('pages/orden', { orden })
  },


  agregarListaDeseo: async (peticion, respuesta) => {
    let foto = await ListaDeseo.findOne({ foto: peticion.params.fotoId, cliente: peticion.session.cliente.id })
    if (foto) {
      peticion.addFlash('mensaje', 'La foto ya había sido agregada a la lista de deseo')
    }
    else {
      await ListaDeseo.create({
        cliente: peticion.session.cliente.id,
        foto: peticion.params.fotoId
      })
      peticion.addFlash('mensaje', 'Foto agregada a la lista de deseo')
    }
    return respuesta.redirect("/")
  },

  listaDeseo: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.cliente) {
      return respuesta.redirect("/")
    }
    let elementos = await ListaDeseo.find({ cliente: peticion.session.cliente.id }).populate('foto')
    respuesta.view('pages/lista_deseo', { elementos })
  },

  eliminarListaDeseo: async (peticion, respuesta) => {
    let foto = await ListaDeseo.findOne({ foto: peticion.params.fotoId, cliente: peticion.session.cliente.id })
    if (foto) {
      await ListaDeseo.destroy({
        cliente: peticion.session.cliente.id,
        foto: peticion.params.fotoId
      })
      peticion.addFlash('mensaje', 'Foto eliminada de la lista de deseo')
    }
    return respuesta.redirect("/lista-deseo")
  },

};

