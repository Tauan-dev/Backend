import express, { Request, Response } from "express";
import mysql from "mysql";
import cors from "cors";

const app = express();
const port = 4000;

app.use(cors()); // Adiciona o middleware CORS para permitir requisições de origens diferentes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexão MySQL
const conn = mysql.createConnection({
  host: "localhost",
  port: 3307,
  user: "root",
  password: "tauan198",
  database: "pizzaria",
});

conn.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectou ao MySQL");

    app.listen(5000, () => {
      console.log("App funcionando na porta 4000");
    });
  }
});

// PEDIDOS DETALHADOS
app.get("/api/pedidos/detalhado", (req: Request, res: Response) => {
  const sql = "SELECT * FROM ViewPedidoDetalhado";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar a view ViewPedidoDetalhado:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results); // Envia todos os resultados como JSON
    }
  });
});

// VIEW PEDIDOS ENTREGUES
app.get("/api/total-entregues-hoje", (req: Request, res: Response) => {
  conn.query(
    "SELECT TotalPedidosEntregues FROM SomaTotalPedidosEntreguesDiaAtual",
    (err, results) => {
      if (err) {
        console.error("Erro ao consultar a view: ", err);
        res.status(500).send("Erro ao processar a requisição");
      } else {
        res.json(results[0]); // Envia o resultado como JSON
      }
    }
  );
});

//# VIEW INGREDIENTES

app.get("/ingredientes", (req: Request, res: Response) => {
  const sql = "SELECT Nome, EstoqueAtual FROM ViewIngredientes";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar a view ViewIngredientes:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// FUNCTION APLICAR DESCONTO

app.get("/aplicar-desconto", (req: Request, res: Response) => {
  conn.query("SELECT AplicarDescontoCliente() AS desconto", (err, results) => {
    if (err) {
      console.error("Erro ao executar a função AplicarDescontoCliente:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results[0]); // Envia o resultado como JSON
    }
  });
});

// FUNCTION APLIXAR TAXA
app.post("/calcular-taxa", (req: Request, res: Response) => {
  const { cep, totalPedido } = req.body;
  const sql = "SELECT AplicarTaxa(?, ?) AS TotalComTaxa";
  conn.query(sql, [cep, totalPedido], (err, results) => {
    if (err) {
      console.error("Erro ao executar a função AplicarTaxa:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json({ TotalComTaxa: results[0].TotalComTaxa });
    }
  });
});

// Rota GET para verificar ingredientes com estoque abaixo de um limite especificado
app.get("/estoque-baixo/:limite", (req: Request, res: Response) => {
  const limiteEstoque = parseInt(req.params.limite);
  conn.query(
    "CALL VerificarEstoqueBaixo(?)",
    [limiteEstoque],
    (err, results) => {
      if (err) {
        console.error(
          "Erro ao executar a procedure VerificarEstoqueBaixo:",
          err
        );
        res.status(500).send("Erro ao processar a requisição");
      } else {
        res.json(results[0]);
      }
    }
  );
});

// Rota GET para obter detalhes de um pedido específico utilizando o ID do pedido
app.get("/detalhes-pedido/:pedidoID", (req: Request, res: Response) => {
  const pedidoID = parseInt(req.params.pedidoID);
  conn.query("CALL DetalhesPedido(?)", [pedidoID], (err, results) => {
    if (err) {
      console.error("Erro ao executar a procedure DetalhesPedido:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results[0]);
    }
  });
});

// Rota POST para analisar as vendas em um determinado período e comparar com o período anterior
app.post("/analise-vendas", (req: Request, res: Response) => {
  const { dataInicio, dataFim } = req.body;
  conn.query(
    "CALL AnalisarVendasPorPeriodo(?, ?)",
    [dataInicio, dataFim],
    (err, results) => {
      if (err) {
        console.error(
          "Erro ao executar a procedure AnalisarVendasPorPeriodo:",
          err
        );
        res.status(500).send("Erro ao processar a requisição");
      } else {
        res.json(results[0]);
      }
    }
  );
});

// Rota POST para atualizar o status de um pedido para 'Entregue', a menos que já esteja entregue
app.post("/entregar-pedido/:pedidoID", (req: Request, res: Response) => {
  const pedidoID = parseInt(req.params.pedidoID);
  conn.query("CALL EntregarPedido(?)", [pedidoID], (err, results) => {
    if (err) {
      console.error("Erro ao executar a procedure EntregarPedido:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      if (results && results[0] && results[0][0] && results[0][0].Mensagem) {
        res.send(results[0][0].Mensagem); // Envia mensagem se o pedido já está entregue
      } else {
        res.send("Status do pedido atualizado para 'Entregue'.");
      }
    }
  });
});

// Rota GET para visualizar todos os pedidos
app.get("/pedidos", (req: Request, res: Response) => {
  conn.query("SELECT * FROM Pedido", (err, results) => {
    if (err) {
      console.error("Erro ao buscar os pedidos:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// Rota GET para verificar o status de atraso de um pedido específico com base em seu ID
app.get("/alerta-atraso/:pedidoID", (req: Request, res: Response) => {
  const pedidoID = parseInt(req.params.pedidoID);
  conn.query(
    "SELECT AlertaAtraso(?) AS MensagemAlerta",
    [pedidoID],
    (err, results) => {
      if (err) {
        console.error("Erro ao executar a função AlertaAtraso:", err);
        res.status(500).send("Erro ao processar a requisição");
      } else {
        res.send(results[0].MensagemAlerta); // Envia a mensagem de alerta ou confirmação de prazo
      }
    }
  );
});

// Rota POST para inserir um novo cliente, acionando os gatilhos de antes e depois da inserção
app.post("/cliente", (req: Request, res: Response) => {
  const { cpf, nome, email } = req.body;
  const sql = "INSERT INTO Cliente (CPF, Nome, Email) VALUES (?, ?, ?)";
  conn.query(sql, [cpf, nome, email], (err, results) => {
    if (err) {
      console.error("Erro ao inserir o cliente:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Cliente inserido com sucesso.");
    }
  });
});

// Rota GET para recuperar todos os clientes
app.get("/clientes", (req: Request, res: Response) => {
  conn.query("SELECT * FROM Cliente", (err, results) => {
    if (err) {
      console.error("Erro ao buscar clientes:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// Rota DELETE para remover um cliente, acionando os gatilhos de antes e depois da deleção
app.delete("/cliente/:cpf", (req: Request, res: Response) => {
  const { cpf } = req.params;
  const sql = "DELETE FROM Cliente WHERE CPF = ?";
  conn.query(sql, [cpf], (err, results) => {
    if (err) {
      console.error("Erro ao deletar o cliente:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Cliente deletado com sucesso.");
    }
  });
});

// Rota PUT para atualizar um cliente, acionando os gatilhos de antes e depois da atualização
app.put("/cliente/:cpf", (req: Request, res: Response) => {
  const { cpf } = req.params;
  const { nome } = req.body;
  const sql = "UPDATE Cliente SET Nome = ? WHERE CPF = ?";
  conn.query(sql, [nome, cpf], (err, results) => {
    if (err) {
      console.error("Erro ao atualizar o cliente:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Cliente atualizado com sucesso.");
    }
  });
});

// Rota para inserir novos clientes
app.post("/inserircliente", (req: Request, res: Response) => {
  const { cpf, nome, email } = req.body;

  // Verifica se todos os campos obrigatórios foram fornecidos
  if (!cpf || !nome || !email) {
    return res
      .status(400)
      .json({ message: "Por favor, forneça CPF, nome e email do cliente." });
  }

  const sql = "INSERT INTO Cliente (CPF, Nome, Email) VALUES (?, ?, ?)";
  conn.query(sql, [cpf, nome, email], (err, results) => {
    if (err) {
      console.error("Erro ao inserir o cliente:", err);
      return res.status(500).send("Erro ao processar a requisição");
    }

    res.status(201).json({ message: "Cliente inserido com sucesso." });
  });
});

// Rota GET para visualizar todos os logs de eventos
app.get("/logs-eventos", (req: Request, res: Response) => {
  const sql = "SELECT * FROM LogEventos";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar os logs de eventos:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// Rota POST para criar um pedido de pizza, acionando o gatilho de dedução de estoque
app.post("/pedido-pizza", (req: Request, res: Response) => {
  const { pedidoID, pizzaID, quantidade } = req.body;
  const sql =
    "INSERT INTO Pedido_Pizza (PedidoID, PizzaID, Quantidade) VALUES (?, ?, ?)";
  conn.query(sql, [pedidoID, pizzaID, quantidade], (err, results) => {
    if (err) {
      console.error("Erro ao inserir o pedido de pizza:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Pedido de pizza registrado com sucesso.");
    }
  });
});

// Rota GET para verificar o estoque atual de um ingrediente específico
app.get("/estoque-ingrediente/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const sql = "SELECT ID, Nome, EstoqueAtual FROM Ingrediente WHERE ID = ?";
  conn.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao verificar o estoque:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results[0]);
    }
  });
});

// Rota POST para inserir um pagamento e acionar a confirmação do pedido
app.post("/pagamento", (req: Request, res: Response) => {
  const { pedidoID, amount } = req.body;
  const sql = "INSERT INTO Pagamento (PedidoID, Amount) VALUES (?, ?)";
  conn.query(sql, [pedidoID, amount], (err, results) => {
    if (err) {
      console.error("Erro ao registrar pagamento:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Pagamento registrado e pedido confirmado com sucesso.");
    }
  });
});

// Rota GET para listar todos os pagamentos
app.get("/pagamentos", (req: Request, res: Response) => {
  const sql = "SELECT * FROM Pagamento";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao listar pagamentos:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// Rota GET para visualizar todas as notificações de baixo estoque
app.get("/notificacoes", (req: Request, res: Response) => {
  const sql = "SELECT * FROM Notificacoes";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar notificações:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

// Rota POST para atualizar o estoque de um ingrediente
app.post("/atualizar-estoque", (req, res) => {
  const { ingredienteID, novoEstoque } = req.body;
  const sql = "UPDATE Ingrediente SET EstoqueAtual = ? WHERE ID = ?";
  conn.query(sql, [novoEstoque, ingredienteID], (err, results) => {
    if (err) {
      console.error("Erro ao atualizar estoque do ingrediente:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.send("Estoque do ingrediente atualizado com sucesso.");
    }
  });
});

// Rota POST para inserir um pagamento e confirmar o pedido
app.post("/confirmar-pedido", (req, res) => {
  const { pedidoID, amount } = req.body;
  const insertPagamentoSQL =
    "INSERT INTO Pagamento (PedidoID, Amount) VALUES (?, ?)";
  const updatePedidoSQL =
    "UPDATE Pedido SET Status = 'Confirmado' WHERE ID = ? AND Status = 'Pendente'";

  conn.beginTransaction(function (err) {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      res.status(500).send("Erro ao processar a requisição");
      return;
    }

    conn.query(insertPagamentoSQL, [pedidoID, amount], (err, results) => {
      if (err) {
        conn.rollback(function () {
          console.error("Erro ao inserir pagamento:", err);
          res.status(500).send("Erro ao processar a requisição");
        });
        return;
      }

      conn.query(updatePedidoSQL, [pedidoID], (err, results) => {
        if (err) {
          conn.rollback(function () {
            console.error("Erro ao atualizar status do pedido:", err);
            res.status(500).send("Erro ao processar a requisição");
          });
          return;
        }

        conn.commit(function (err) {
          if (err) {
            conn.rollback(function () {
              console.error("Erro ao confirmar transação:", err);
              res.status(500).send("Erro ao processar a requisição");
            });
          } else {
            res.send("Pagamento registrado e pedido confirmado com sucesso.");
          }
        });
      });
    });
  });
});

// Rota POST para inserir um pagamento e gerar um recibo
app.post("/gerar-recibo", (req, res) => {
  const { pedidoID, amount } = req.body;
  const insertPagamentoSQL =
    "INSERT INTO Pagamento (PedidoID, Amount) VALUES (?, ?)";
  const insertReciboSQL =
    "INSERT INTO Recibo (PedidoID, DataPagamento, ValorPago) VALUES (?, NOW(), ?)";

  conn.beginTransaction(function (err) {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      res.status(500).send("Erro ao processar a requisição");
      return;
    }

    conn.query(insertPagamentoSQL, [pedidoID, amount], (err, results) => {
      if (err) {
        conn.rollback(function () {
          console.error("Erro ao inserir pagamento:", err);
          res.status(500).send("Erro ao processar a requisição");
        });
        return;
      }

      conn.query(insertReciboSQL, [pedidoID, amount], (err, results) => {
        if (err) {
          conn.rollback(function () {
            console.error("Erro ao gerar recibo:", err);
            res.status(500).send("Erro ao processar a requisição");
          });
          return;
        }

        conn.commit(function (err) {
          if (err) {
            conn.rollback(function () {
              console.error("Erro ao confirmar transação:", err);
              res.status(500).send("Erro ao processar a requisição");
            });
          } else {
            res.send("Pagamento registrado e recibo gerado com sucesso.");
          }
        });
      });
    });
  });
});

app.get("/pagamentos", (req, res) => {
  const sql = "SELECT * FROM Pagamento";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar pagamentos:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

app.get("/recibos", (req, res) => {
  const sql = "SELECT * FROM Recibo";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao consultar recibos:", err);
      res.status(500).send("Erro ao processar a requisição");
    } else {
      res.json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

conn.on("error", (err) => {
  console.error("Erro de conexão com o MySQL:", err);
});
