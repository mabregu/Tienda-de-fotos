/**
 * PrincipalController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    inicio: async(peticion, respuesta) => {
        let fotos = await Foto.find({ activa: true }).sort("id")
        respuesta.view('pages/inicio', { fotos })
    },

    topVendidas: async(peticion, respuesta) => {

        let consulta = `
    SELECT
      titulo,
      contenido,
      COUNT ( * ) AS cantidad
    FROM
      orden_detalle
      INNER JOIN foto ON orden_detalle.foto_id = foto.ID
    GROUP BY
      titulo, contenido, foto_id
    ORDER BY
    COUNT ( * ) DESC
    LIMIT 10
    `

        await OrdenDetalle.query(consulta, [], (errores, resultado) => {
            let fotos = resultado.rows
            respuesta.view('pages/top_vendidas', { fotos })
        })
    }


};
