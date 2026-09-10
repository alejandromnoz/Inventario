const express = require("express");
const Database = require("better-sqlite3");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Necesario cuando la aplicación está detrás de un proxy
// como Render, Railway, etc.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "CAMBIAR-ESTA-CLAVE-INVENTARIO-2026",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",

            secure:
                process.env.NODE_ENV === "production",

            maxAge: 8 * 60 * 60 * 1000
        }
    })
);

// ==========================================
// BASE DE DATOS
// ==========================================

const db = new Database(
    path.join(__dirname, "inventario.db")
);

db.pragma("journal_mode = WAL");

// ==========================================
// TABLA USUARIOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'Administrador'
    )
`).run();

// ==========================================
// TABLA CATEGORÍAS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    )
`).run();

// ==========================================
// TABLA PRODUCTOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 0,
        precio REAL NOT NULL DEFAULT 0
    )
`).run();

// ==========================================
// CREAR ADMINISTRADOR SI NO EXISTE
// ==========================================

const usuarioAdmin = db.prepare(`
    SELECT *
    FROM usuarios
    WHERE usuario = ?
`).get("admin");

if (!usuarioAdmin) {

    const passwordInicial =
        process.env.ADMIN_PASSWORD;

    if (!passwordInicial) {

        console.error("");
        console.error("=================================");
        console.error(" ERROR DE CONFIGURACIÓN");
        console.error("=================================");
        console.error(
            "Falta configurar ADMIN_PASSWORD."
        );
        console.error(
            "Configure ADMIN_PASSWORD en las variables de entorno."
        );
        console.error("=================================");
        console.error("");

        process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(
        passwordInicial,
        10
    );

    db.prepare(`
        INSERT INTO usuarios
        (usuario, password, nombre, rol)
        VALUES (?, ?, ?, ?)
    `).run(
        "admin",
        passwordHash,
        "Administrador",
        "Administrador"
    );

    console.log("");
    console.log("=================================");
    console.log(" USUARIO ADMINISTRADOR CREADO");
    console.log("=================================");
    console.log("Usuario: admin");
    console.log(
        "Contraseña inicial configurada mediante ADMIN_PASSWORD"
    );
    console.log("=================================");
    console.log("");
}

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================

function requiereLogin(req, res, next) {

    if (req.session.usuario) {
        return next();
    }

    return res.status(401).json({
        error: "Debe iniciar sesión"
    });
}

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", (req, res) => {

    try {

        const usuario =
            String(req.body.usuario || "").trim();

        const password =
            String(req.body.password || "");

        if (!usuario || !password) {

            return res.status(400).json({
                error: "Ingrese usuario y contraseña"
            });
        }

        const encontrado =
            db.prepare(`
                SELECT *
                FROM usuarios
                WHERE usuario = ?
            `).get(usuario);

        if (!encontrado) {

            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        const correcto =
            bcrypt.compareSync(
                password,
                encontrado.password
            );

        if (!correcto) {

            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        req.session.usuario = {
            id: encontrado.id,
            usuario: encontrado.usuario,
            nombre: encontrado.nombre,
            rol: encontrado.rol
        };

        res.json({
            ok: true,
            usuario: req.session.usuario
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error al iniciar sesión"
        });
    }
});

// ==========================================
// COMPROBAR SESIÓN
// ==========================================

app.get("/api/sesion", (req, res) => {

    if (!req.session.usuario) {

        return res.json({
            autenticado: false
        });
    }

    res.json({
        autenticado: true,
        usuario: req.session.usuario
    });
});

// ==========================================
// CERRAR SESIÓN
// ==========================================

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            ok: true
        });

    });
});

// ==========================================
// INFORMACIÓN DEL USUARIO
// ==========================================

app.get(
    "/api/usuario",
    requiereLogin,
    (req, res) => {

        res.json(req.session.usuario);

    }
);

// ==========================================
// PRODUCTOS - LISTAR
// ==========================================

app.get(
    "/api/productos",
    requiereLogin,
    (req, res) => {

        try {

            const productos =
                db.prepare(`
                    SELECT *
                    FROM productos
                    ORDER BY id DESC
                `).all();

            res.json(productos);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error al obtener productos"
            });
        }
    }
);

// ==========================================
// PRODUCTOS - CREAR
// ==========================================

app.post(
    "/api/productos",
    requiereLogin,
    (req, res) => {

        try {

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const categoria =
                String(
                    req.body.categoria || ""
                ).trim();

            const cantidad =
                Number(req.body.cantidad);

            const precio =
                Number(req.body.precio);

            if (!nombre || !categoria) {

                return res.status(400).json({
                    error:
                        "Nombre y categoría son obligatorios"
                });
            }

            if (
                !Number.isFinite(cantidad) ||
                cantidad < 0
            ) {

                return res.status(400).json({
                    error: "Cantidad inválida"
                });
            }

            if (
                !Number.isFinite(precio) ||
                precio < 0
            ) {

                return res.status(400).json({
                    error: "Precio inválido"
                });
            }

            const resultado =
                db.prepare(`
                    INSERT INTO productos
                    (nombre, categoria, cantidad, precio)
                    VALUES (?, ?, ?, ?)
                `).run(
                    nombre,
                    categoria,
                    cantidad,
                    precio
                );

            const producto =
                db.prepare(`
                    SELECT *
                    FROM productos
                    WHERE id = ?
                `).get(
                    resultado.lastInsertRowid
                );

            res.status(201).json(producto);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error al guardar producto"
            });
        }
    }
);

// ==========================================
// PRODUCTOS - EDITAR
// ==========================================

app.put(
    "/api/productos/:id",
    requiereLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const categoria =
                String(
                    req.body.categoria || ""
                ).trim();

            const cantidad =
                Number(req.body.cantidad);

            const precio =
                Number(req.body.precio);

            if (!nombre || !categoria) {

                return res.status(400).json({
                    error:
                        "Nombre y categoría son obligatorios"
                });
            }

            if (
                !Number.isFinite(cantidad) ||
                cantidad < 0
            ) {

                return res.status(400).json({
                    error: "Cantidad inválida"
                });
            }

            if (
                !Number.isFinite(precio) ||
                precio < 0
            ) {

                return res.status(400).json({
                    error: "Precio inválido"
                });
            }

            const resultado =
                db.prepare(`
                    UPDATE productos
                    SET
                        nombre = ?,
                        categoria = ?,
                        cantidad = ?,
                        precio = ?
                    WHERE id = ?
                `).run(
                    nombre,
                    categoria,
                    cantidad,
                    precio,
                    id
                );

            if (resultado.changes === 0) {

                return res.status(404).json({
                    error:
                        "Producto no encontrado"
                });
            }

            const producto =
                db.prepare(`
                    SELECT *
                    FROM productos
                    WHERE id = ?
                `).get(id);

            res.json(producto);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Error al actualizar producto"
            });
        }
    }
);

// ==========================================
// PRODUCTOS - ELIMINAR
// ==========================================

app.delete(
    "/api/productos/:id",
    requiereLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const resultado =
                db.prepare(`
                    DELETE FROM productos
                    WHERE id = ?
                `).run(id);

            if (resultado.changes === 0) {

                return res.status(404).json({
                    error:
                        "Producto no encontrado"
                });
            }

            res.json({
                ok: true,
                mensaje:
                    "Producto eliminado correctamente"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Error al eliminar producto"
            });
        }
    }
);

// ==========================================
// CATEGORÍAS - LISTAR
// ==========================================

app.get(
    "/api/categorias",
    requiereLogin,
    (req, res) => {

        try {

            const categorias =
                db.prepare(`
                    SELECT *
                    FROM categorias
                    ORDER BY nombre ASC
                `).all();

            res.json(categorias);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Error al obtener categorías"
            });
        }
    }
);

// ==========================================
// CATEGORÍAS - CREAR
// ==========================================

app.post(
    "/api/categorias",
    requiereLogin,
    (req, res) => {

        try {

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            if (!nombre) {

                return res.status(400).json({
                    error:
                        "El nombre es obligatorio"
                });
            }

            const resultado =
                db.prepare(`
                    INSERT INTO categorias
                    (nombre)
                    VALUES (?)
                `).run(nombre);

            const categoria =
                db.prepare(`
                    SELECT *
                    FROM categorias
                    WHERE id = ?
                `).get(
                    resultado.lastInsertRowid
                );

            res.status(201).json(categoria);

        } catch (error) {

            console.error(error);

            if (
                error.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(400).json({
                    error:
                        "La categoría ya existe"
                });
            }

            res.status(500).json({
                error:
                    "Error al crear categoría"
            });
        }
    }
);

// ==========================================
// CATEGORÍAS - EDITAR
// ==========================================

app.put(
    "/api/categorias/:id",
    requiereLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            if (!nombre) {

                return res.status(400).json({
                    error:
                        "El nombre es obligatorio"
                });
            }

            const resultado =
                db.prepare(`
                    UPDATE categorias
                    SET nombre = ?
                    WHERE id = ?
                `).run(
                    nombre,
                    id
                );

            if (resultado.changes === 0) {

                return res.status(404).json({
                    error:
                        "Categoría no encontrada"
                });
            }

            const categoria =
                db.prepare(`
                    SELECT *
                    FROM categorias
                    WHERE id = ?
                `).get(id);

            res.json(categoria);

        } catch (error) {

            console.error(error);

            if (
                error.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(400).json({
                    error:
                        "La categoría ya existe"
                });
            }

            res.status(500).json({
                error:
                    "Error al actualizar categoría"
            });
        }
    }
);

// ==========================================
// CATEGORÍAS - ELIMINAR
// ==========================================

app.delete(
    "/api/categorias/:id",
    requiereLogin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const resultado =
                db.prepare(`
                    DELETE FROM categorias
                    WHERE id = ?
                `).run(id);

            if (resultado.changes === 0) {

                return res.status(404).json({
                    error:
                        "Categoría no encontrada"
                });
            }

            res.json({
                ok: true,
                mensaje:
                    "Categoría eliminada correctamente"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Error al eliminar categoría"
            });
        }
    }
);

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// ==========================================
// SERVIR ARCHIVOS
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// ==========================================
// SERVIDOR
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("=================================");
        console.log(" SISTEMA DE INVENTARIO");
        console.log("=================================");
        console.log(
            `Servidor funcionando en http://localhost:${PORT}`
        );
        console.log("");
    }
);