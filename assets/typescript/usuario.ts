class Usuario {
    constructor(
        public cpf: string,
        public nome: string,
        public email: string,
        protected senha: string,
        public tipo: 'cliente' = 'cliente',
        public pontos: number = 0    
    ) {}
} 