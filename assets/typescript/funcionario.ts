class Funcionario{
    constructor(
        public id: number,
        public nome: string,
        public email: string,
        protected senha: string,
        public tipo: 'admin' | 'funcionario' = 'funcionario'
    ) {}
}