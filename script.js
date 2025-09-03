        // Dados armazenados localmente
        let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        let clientesCadastrados = JSON.parse(localStorage.getItem('clientesCadastrados')) || {};
        let clientes = JSON.parse(localStorage.getItem('clientes')) || {};

        // Função para salvar dados
        function salvarDados() {
            localStorage.setItem('transacoes', JSON.stringify(transacoes));
            localStorage.setItem('clientesCadastrados', JSON.stringify(clientesCadastrados));
            localStorage.setItem('clientes', JSON.stringify(clientes));
        }

        // Função para trocar abas
        function trocarAba(aba) {
            // Esconder todas as abas
            document.querySelectorAll('.aba-content').forEach(el => el.style.display = 'none');
            
            // Remover classe ativa de todos os botões
            document.querySelectorAll('[id^="tab"]').forEach(el => {
                el.className = el.className.replace('tab-active', 'tab-inactive');
            });
            
            // Mostrar aba selecionada
            document.getElementById('aba' + aba.charAt(0).toUpperCase() + aba.slice(1)).style.display = 'block';
            
            // Ativar botão da aba
            document.getElementById('tab' + aba.charAt(0).toUpperCase() + aba.slice(1)).className = 
                document.getElementById('tab' + aba.charAt(0).toUpperCase() + aba.slice(1)).className.replace('tab-inactive', 'tab-active');
            
            // Atualizar dados se necessário
            if (aba === 'transacoes') {
                atualizarSelectClientes();
            }
        }

        // Função para formatar moeda
        function formatarMoeda(valor) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(valor);
        }

        // Função para calcular totais
        function calcularTotais() {
            let totalEntradas = 0;
            let totalSaidas = 0;

            transacoes.forEach(transacao => {
                if (transacao.tipo === 'entrada') {
                    totalEntradas += transacao.valor;
                } else {
                    totalSaidas += transacao.valor;
                }
            });

            const saldoTotal = totalEntradas - totalSaidas;

            document.getElementById('totalEntradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('totalSaidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('saldoTotal').textContent = formatarMoeda(saldoTotal);

            // Mudar cor do saldo baseado no valor
            const saldoElement = document.getElementById('saldoTotal').parentElement.parentElement.parentElement;
            if (saldoTotal >= 0) {
                saldoElement.className = saldoElement.className.replace('bg-red-600', 'bg-blue-600');
            } else {
                saldoElement.className = saldoElement.className.replace('bg-blue-600', 'bg-red-600');
            }
        }

        // Função para cadastrar cliente
        function cadastrarCliente(codigo, nome, email, telefone) {
            if (clientesCadastrados[codigo]) {
                alert('Cliente com este código já existe!');
                return false;
            }
            
            clientesCadastrados[codigo] = {
                nome,
                email: email || '',
                telefone: telefone || '',
                dataCadastro: new Date().toLocaleDateString('pt-BR')
            };
            
            salvarDados();
            renderizarClientesCadastrados();
            atualizarSelectClientes();
            return true;
        }

        // Função para renderizar clientes cadastrados
        function renderizarClientesCadastrados() {
            const lista = document.getElementById('listaClientesCadastrados');
            
            if (Object.keys(clientesCadastrados).length === 0) {
                lista.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <span class="text-4xl mb-4 block">👥</span>
                        <p>Nenhum cliente cadastrado</p>
                        <p class="text-sm">Cadastre o primeiro cliente</p>
                    </div>
                `;
                return;
            }

            lista.innerHTML = Object.entries(clientesCadastrados).map(([codigo, dados]) => `
                <div class="bg-gray-50 rounded-lg p-4 fade-in">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800">${dados.nome}</h3>
                            <p class="text-sm text-blue-600 font-medium">Código: ${codigo}</p>
                            ${dados.email ? `<p class="text-sm text-gray-600">📧 ${dados.email}</p>` : ''}
                            ${dados.telefone ? `<p class="text-sm text-gray-600">📱 ${dados.telefone}</p>` : ''}
                            <p class="text-xs text-gray-500 mt-1">Cadastrado em: ${dados.dataCadastro}</p>
                        </div>
                        <button onclick="removerCliente('${codigo}')" class="text-red-500 hover:text-red-700 text-sm">
                            🗑️ Remover
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Função para atualizar select de clientes
        function atualizarSelectClientes() {
            const select = document.getElementById('clienteSelect');
            select.innerHTML = '<option value="">Selecione um cliente</option>';
            
            Object.entries(clientesCadastrados).forEach(([codigo, dados]) => {
                const option = document.createElement('option');
                option.value = codigo;
                option.textContent = `${codigo} - ${dados.nome}`;
                select.appendChild(option);
            });
        }

        // Função para remover cliente
        function removerCliente(codigo) {
            if (confirm('Tem certeza que deseja remover este cliente? Todas as transações relacionadas serão mantidas.')) {
                delete clientesCadastrados[codigo];
                salvarDados();
                renderizarClientesCadastrados();
                atualizarSelectClientes();
            }
        }

        // Função para atualizar saldos dos clientes
        function atualizarSaldosClientes() {
            clientes = {};
            
            transacoes.forEach(transacao => {
                if (!clientes[transacao.codigoCliente]) {
                    const clienteInfo = clientesCadastrados[transacao.codigoCliente];
                    clientes[transacao.codigoCliente] = { 
                        nome: clienteInfo ? clienteInfo.nome : transacao.nomeCliente,
                        entradas: 0, 
                        saidas: 0, 
                        saldo: 0 
                    };
                }
                
                if (transacao.tipo === 'entrada') {
                    clientes[transacao.codigoCliente].entradas += transacao.valor;
                } else {
                    clientes[transacao.codigoCliente].saidas += transacao.valor;
                }
                
                clientes[transacao.codigoCliente].saldo = clientes[transacao.codigoCliente].entradas - clientes[transacao.codigoCliente].saidas;
            });

            renderizarListaClientes();
        }

        // Função para renderizar lista de clientes
        function renderizarListaClientes() {
            const listaClientes = document.getElementById('listaClientes');
            
            if (Object.keys(clientes).length === 0) {
                listaClientes.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <span class="text-4xl mb-4 block">📊</span>
                        <p>Nenhum cliente cadastrado ainda</p>
                        <p class="text-sm">Adicione uma transação para começar</p>
                    </div>
                `;
                return;
            }

            const clientesOrdenados = Object.entries(clientes).sort((a, b) => b[1].saldo - a[1].saldo);
            
            listaClientes.innerHTML = clientesOrdenados.map(([codigo, dados]) => `
                <div class="bg-gray-50 rounded-lg p-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-gray-800">${dados.nome}</h3>
                            <p class="text-sm text-gray-600">
                                Código: ${codigo} | 
                                Entradas: ${formatarMoeda(dados.entradas)} | 
                                Saídas: ${formatarMoeda(dados.saidas)}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold ${dados.saldo >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${formatarMoeda(dados.saldo)}
                            </p>
                            <span class="text-xs px-2 py-1 rounded-full ${dados.saldo >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${dados.saldo >= 0 ? 'Positivo' : 'Negativo'}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Funções para upload de arquivo
        let arquivoSelecionado = null;

        function configurarUpload() {
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('comprovante');

            // Click para selecionar arquivo
            dropZone.addEventListener('click', () => fileInput.click());

            // Drag and drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    processarArquivo(files[0]);
                }
            });

            // Seleção de arquivo
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    processarArquivo(e.target.files[0]);
                }
            });
        }

        function processarArquivo(file) {
            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande! Máximo 5MB.');
                return;
            }

            // Validar tipo
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!tiposPermitidos.includes(file.type)) {
                alert('Tipo de arquivo não permitido! Use PNG, JPG ou PDF.');
                return;
            }

            arquivoSelecionado = file;
            mostrarPreview(file);
        }

        function mostrarPreview(file) {
            document.getElementById('dropText').classList.add('hidden');
            document.getElementById('filePreview').classList.remove('hidden');
            document.getElementById('fileName').textContent = file.name;
        }

        function removerArquivo() {
            arquivoSelecionado = null;
            document.getElementById('dropText').classList.remove('hidden');
            document.getElementById('filePreview').classList.add('hidden');
            document.getElementById('comprovante').value = '';
        }

        function salvarArquivo(file, transacaoId) {
            if (!file) return null;
            
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = function(e) {
                    const arquivoData = {
                        nome: file.name,
                        tipo: file.type,
                        tamanho: file.size,
                        data: e.target.result
                    };
                    
                    // Salvar no localStorage (limitado, mas funcional para demo)
                    localStorage.setItem(`arquivo_${transacaoId}`, JSON.stringify(arquivoData));
                    resolve(`arquivo_${transacaoId}`);
                };
                reader.readAsDataURL(file);
            });
        }

        // Função para renderizar histórico
        function renderizarHistorico() {
            const historicoTransacoes = document.getElementById('historicoTransacoes');
            
            if (transacoes.length === 0) {
                historicoTransacoes.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-8 text-gray-500">
                            <span class="text-4xl mb-4 block">📝</span>
                            <p>Nenhuma transação registrada</p>
                            <p class="text-sm">As transações aparecerão aqui automaticamente</p>
                        </td>
                    </tr>
                `;
                return;
            }

            const transacoesOrdenadas = [...transacoes].reverse();
            
            historicoTransacoes.innerHTML = transacoesOrdenadas.map(transacao => {
                const clienteInfo = clientesCadastrados[transacao.codigoCliente];
                const nomeCliente = clienteInfo ? clienteInfo.nome : transacao.nomeCliente || 'Cliente não encontrado';
                
                return `
                    <tr class="border-b hover:bg-gray-50 fade-in">
                        <td class="py-3 px-4 text-sm text-gray-600">${transacao.data}</td>
                        <td class="py-3 px-4 font-medium text-blue-600">${transacao.codigoCliente}</td>
                        <td class="py-3 px-4 font-medium">${nomeCliente}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                transacao.tipo === 'entrada' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${transacao.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-gray-700">${transacao.descricao}</td>
                        <td class="py-3 px-4 text-center">
                            ${transacao.comprovante ? 
                                `<button onclick="visualizarComprovante('${transacao.comprovante}')" class="text-blue-600 hover:text-blue-800">
                                    📎 Ver
                                </button>` : 
                                '<span class="text-gray-400">-</span>'
                            }
                        </td>
                        <td class="py-3 px-4 text-right font-semibold ${
                            transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }">
                            ${transacao.tipo === 'entrada' ? '+' : '-'} ${formatarMoeda(transacao.valor)}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function visualizarComprovante(comprovanteId) {
            const arquivo = JSON.parse(localStorage.getItem(comprovanteId));
            if (arquivo) {
                const novaJanela = window.open('', '_blank');
                if (arquivo.tipo === 'application/pdf') {
                    novaJanela.document.write(`
                        <html>
                            <head><title>Comprovante - ${arquivo.nome}</title></head>
                            <body style="margin:0;">
                                <embed src="${arquivo.data}" width="100%" height="100%" type="application/pdf">
                            </body>
                        </html>
                    `);
                } else {
                    novaJanela.document.write(`
                        <html>
                            <head><title>Comprovante - ${arquivo.nome}</title></head>
                            <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                                <img src="${arquivo.data}" style="max-width:100%; max-height:100%; object-fit:contain;">
                            </body>
                        </html>
                    `);
                }
            }
        }

        // Função para adicionar transação
        async function adicionarTransacao(data, codigoCliente, tipo, valor, descricao) {
            const transacaoId = Date.now();
            let comprovanteId = null;
            
            // Salvar arquivo se existir
            if (arquivoSelecionado) {
                comprovanteId = await salvarArquivo(arquivoSelecionado, transacaoId);
            }
            
            const novaTransacao = {
                id: transacaoId,
                data,
                codigoCliente,
                tipo,
                valor: parseFloat(valor),
                descricao,
                comprovante: comprovanteId
            };

            transacoes.push(novaTransacao);
            salvarDados();
            
            calcularTotais();
            atualizarSaldosClientes();
            renderizarHistorico();
            
            // Limpar arquivo selecionado
            removerArquivo();
        }

        // Event listeners
        document.getElementById('clienteForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const codigo = document.getElementById('codigoNovoCliente').value.trim();
            const nome = document.getElementById('nomeNovoCliente').value.trim();
            const email = document.getElementById('emailNovoCliente').value.trim();
            const telefone = document.getElementById('telefoneNovoCliente').value.trim();

            if (codigo && nome) {
                if (cadastrarCliente(codigo, nome, email, telefone)) {
                    // Limpar formulário
                    this.reset();
                    
                    // Feedback visual
                    const button = this.querySelector('button');
                    const originalText = button.innerHTML;
                    button.innerHTML = '✅ Cliente Cadastrado!';
                    button.classList.add('bg-green-600');
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('bg-green-600');
                    }, 2000);
                }
            }
        });

        document.getElementById('transacaoForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = document.getElementById('data').value;
            const codigoCliente = document.getElementById('clienteSelect').value;
            const tipo = document.getElementById('tipo').value;
            const valor = document.getElementById('valor').value;
            const descricao = document.getElementById('descricao').value.trim();

            if (data && codigoCliente && tipo && valor && descricao) {
                await adicionarTransacao(data, codigoCliente, tipo, valor, descricao);
                
                // Limpar formulário
                this.reset();
                
                // Definir data padrão novamente
                const hoje = new Date().toISOString().split('T')[0];
                document.getElementById('data').value = hoje;
                
                // Feedback visual
                const button = this.querySelector('button');
                const originalText = button.innerHTML;
                button.innerHTML = '✅ Transação Registrada!';
                button.classList.add('bg-green-600');
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('bg-green-600');
                }, 2000);
            }
        });

        // Inicializar a aplicação
        function inicializar() {
            // Definir data padrão como hoje
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('data').value = hoje;
            
            // Configurar upload
            configurarUpload();
            
            // Renderizar dados
            renderizarClientesCadastrados();
            atualizarSelectClientes();
            calcularTotais();
            atualizarSaldosClientes();
            renderizarHistorico();
        }

        // Carregar dados ao iniciar
        inicializar();
