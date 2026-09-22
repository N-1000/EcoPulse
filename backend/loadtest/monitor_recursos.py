# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - loadtest/monitor_recursos.py
#
# Muestrea CPU% y memoria (RSS) del proceso del servidor mockeado cada 1s
# mientras corre la prueba de carga, para no dejar el punto 3 del reporte
# ("qué se rompió: CPU o memoria") como una suposición.
#
# Uso (en paralelo a uvicorn y locust, mismo PID que uvicorn):
#   python loadtest/monitor_recursos.py <pid> <archivo_csv_salida>
# ===================================================
import csv
import sys
import time

import psutil


def main() -> None:
    if len(sys.argv) != 3:
        print("uso: monitor_recursos.py <pid> <archivo_csv_salida>")
        sys.exit(1)

    pid = int(sys.argv[1])
    salida = sys.argv[2]
    proceso = psutil.Process(pid)

    # Primer cpu_percent() siempre da 0.0 -- es una lectura de referencia,
    # se descarta antes de empezar a escribir filas reales.
    proceso.cpu_percent(interval=None)

    print(f"Monitoreando PID {pid}, escribiendo a {salida} cada 1s. Ctrl+C para cortar.")
    with open(salida, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "cpu_percent", "rss_mb", "num_threads"])
        f.flush()
        inicio = time.time()
        try:
            while True:
                time.sleep(1.0)
                try:
                    cpu = proceso.cpu_percent(interval=None)
                    mem = proceso.memory_info().rss / (1024 * 1024)
                    hilos = proceso.num_threads()
                except psutil.NoSuchProcess:
                    print("El proceso terminó -- corte el monitor.")
                    break
                writer.writerow([round(time.time() - inicio, 1), cpu, round(mem, 1), hilos])
                f.flush()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
