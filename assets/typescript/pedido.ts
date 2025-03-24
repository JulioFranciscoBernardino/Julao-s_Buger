class Pedido{
    constructor(
        public idPedido: number,
        public cpf: string,
        public dataPedido: Date,
        public status: 'pendente' | 'em preparo' | 'finalizado',
        public idEndereco: number
    ) {}
}