import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getPaymentTypes(){
    const metodos = {
      credito: "Tarjeta de crédito",
      debito: "Tarjeta de débito",
      trans: "Transferenca bancaria"
    };
    return metodos;
  }
  validateCard(tarjeta): string{
    // Aceptar sólo digitos, guiones o espacios
    if (!tarjeta.tipo) return '400 Ingrese un tipo de tarjeta';
    if (tarjeta.tipo != 'credito' || tarjeta.tipo != 'debito' || tarjeta.tipo != 'trans') return '400 tipo inválido de tarjeta';
    if (/[^0-9-\s]+/.test(tarjeta.numero)) return '400 Ingrese un número válido';
    if (!tarjeta.numero) return '400 Ingrese un número';
    if (!tarjeta.month && !tarjeta.year) return '400 ingrese año y mes';
    // Algoritmo de Luhn para verificar la validez del número
    var nCheck = 0, nDigit = 0, bEven = false;
    tarjeta.numero = tarjeta.numero.replace(/\D/g, "");

    for (var n = tarjeta.numero.length -1; n>= 0; n--){
      var cDigit = tarjeta.numero.charAt(n),
          nDigit = parseInt(cDigit, 10);

      if (bEven) {
        if((nDigit *= 2) > 9) nDigit -= 9;
      }
      nCheck += nDigit;
      bEven = !bEven;
    }
    nCheck = nCheck % 10
    if (nCheck == 0){
      if (tarjeta.month > 0 && tarjeta.month < 13){
        if (tarjeta.year >= (new Date()).getFullYear()) return '202';
        else return '400 tarjeta vencida';
      } else return '400 mes inváldo';
    }
    else {
      return '400 el número no es válido';
    }
  }

}
